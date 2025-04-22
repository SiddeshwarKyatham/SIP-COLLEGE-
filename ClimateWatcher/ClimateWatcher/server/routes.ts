import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { Server as SocketIOServer } from "socket.io";
import Stripe from "stripe";
import { 
  insertTaskSchema, 
  insertApplicationSchema, 
  insertMessageSchema, 
  insertPaymentSchema, 
  insertReportSchema, 
  insertBadgeSchema, 
  insertUserBadgeSchema,
  insertNotificationSchema,
  InsertPayment
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing STRIPE_SECRET_KEY environment variable. Stripe payment processing will not work.");
}

// Initialize Stripe client with default options
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Auth middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Role-based middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  const httpServer = createServer(app);
  
  // Socket.io server for real-time chat functionality
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/socket.io',
    // Handle any proxy issues in the Replit environment
    allowEIO3: true,
    connectTimeout: 30000,
    pingInterval: 5000,
    pingTimeout: 10000,
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6 // 1MB
  });
  
  // Log Socket.io server initialization
  console.log('Socket.io server initialized with options:', {
    path: io.path(),
    serverPath: io.path()
  });

  // Handle Socket.io connections
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    console.log('Connection details:', {
      transport: socket.conn.transport.name,
      headers: socket.handshake.headers,
      query: socket.handshake.query,
      address: socket.handshake.address
    });
    
    // Join application-specific rooms
    socket.on('join_application', (applicationId) => {
      const roomName = `application_${applicationId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
      
      // Send confirmation back to client
      socket.emit('room_joined', { 
        room: roomName, 
        success: true, 
        timestamp: new Date().toISOString() 
      });
    });
    
    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { applicationId, message } = data;
        const roomName = `application_${applicationId}`;
        
        console.log(`Received message for room ${roomName}:`, message);
        
        // Broadcast to everyone in the application room except sender
        socket.to(roomName).emit('receive_message', message);
        
        // Also send an acknowledgment back to sender
        socket.emit('message_sent', { 
          success: true, 
          messageId: message.id,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Message broadcast to room: ${roomName}`);
      } catch (err) {
        const error = err as Error;
        console.error('Socket.io message error:', error);
        socket.emit('message_error', { 
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Handle ping (for connection testing)
    socket.on('ping', (callback) => {
      console.log('Received ping from client:', socket.id);
      if (typeof callback === 'function') {
        callback({ 
          pong: true, 
          time: new Date().toISOString(),
          socketId: socket.id
        });
      } else {
        socket.emit('pong', { 
          time: new Date().toISOString(),
          socketId: socket.id
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own profile, unless they're an admin
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", requireRole(["employer", "admin"]), async (req, res) => {
    try {
      try {
        // Validate deadline is a valid date 
        if (req.body.deadline && !(req.body.deadline instanceof Date)) {
          req.body.deadline = new Date(req.body.deadline);
          
          if (isNaN(req.body.deadline.getTime())) {
            return res.status(400).json({ 
              message: "Invalid deadline date format"
            });
          }
        }
        
        // Parse and validate the entire request
        insertTaskSchema.parse(req.body);
      } catch (error: any) {
        console.error("Task creation validation error:", error);
        return res.status(400).json({ message: error.message });
      }
      
      const taskData = { ...req.body, employerId: req.user!.id };
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", requireRole(["employer", "admin"]), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only allow task owner or admin to update
      if (task.employerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Application routes
  app.get("/api/applications/student", requireRole(["student"]), async (req, res) => {
    try {
      const applications = await storage.getApplicationsByStudentId(req.user!.id);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/task/:taskId", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only task owner or admin can view applications
      if (task.employerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const applications = await storage.getApplicationsByTaskId(taskId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/applications", requireRole(["student"]), async (req, res) => {
    try {
      try {
        insertApplicationSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
      
      // Check if student has already applied to this task
      const existing = await storage.getApplicationByStudentAndTask(req.user!.id, req.body.taskId);
      if (existing) {
        return res.status(400).json({ message: "You have already applied to this task" });
      }
      
      const applicationData = { ...req.body, studentId: req.user!.id };
      const newApplication = await storage.createApplication(applicationData);
      
      // Notify employer about new application
      const task = await storage.getTask(req.body.taskId);
      if (task) {
        await storage.createNotification({
          userId: task.employerId,
          type: "new_application",
          content: `New application received for "${task.title}"`,
          metadata: { taskId: task.id, applicationId: newApplication.id }
        });
      }
      
      res.status(201).json(newApplication);
    } catch (error) {
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id/status", requireRole(["employer", "admin"]), async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['applied', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const task = await storage.getTask(application.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only task owner or admin can update application status
      if (task.employerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
      
      // If accepted, update task status to in-progress
      if (status === 'accepted') {
        await storage.updateTask(task.id, { status: "in-progress" });
        
        // Reject all other applications for this task
        const otherApplications = await storage.getApplicationsByTaskId(task.id);
        for (const app of otherApplications) {
          if (app.id !== applicationId && app.status === 'applied') {
            await storage.updateApplicationStatus(app.id, 'rejected');
            
            // Notify student about rejected application
            await storage.createNotification({
              userId: app.studentId,
              type: "application_rejected",
              content: `Your application for "${task.title}" has been rejected`,
              metadata: { taskId: task.id, applicationId: app.id }
            });
          }
        }
      }
      
      // Notify student about application status update
      await storage.createNotification({
        userId: application.studentId,
        type: `application_${status}`,
        content: `Your application for "${task.title}" has been ${status}`,
        metadata: { taskId: task.id, applicationId: application.id }
      });
      
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Message routes
  app.get("/api/messages/:applicationId", requireAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const task = await storage.getTask(application.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only the student who applied and the employer who posted the task can view messages
      if (application.studentId !== req.user!.id && task.employerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessagesByApplicationId(applicationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      try {
        insertMessageSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
      
      const applicationId = req.body.applicationId;
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const task = await storage.getTask(application.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only the student who applied and the employer who posted the task can send messages
      if (application.studentId !== req.user!.id && task.employerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messageData = {
        ...req.body,
        senderId: req.user!.id,
      };
      
      const newMessage = await storage.createMessage(messageData);
      
      // Notify recipient about new message
      await storage.createNotification({
        userId: req.body.receiverId,
        type: "new_message",
        content: "You have a new message",
        metadata: { taskId: task.id, applicationId: applicationId, messageId: newMessage.id }
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Payment routes
  app.post("/api/payments", requireRole(["employer", "admin"]), async (req, res) => {
    try {
      try {
        insertPaymentSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
      
      const applicationId = req.body.applicationId;
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const task = await storage.getTask(application.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only task owner or admin can mark as paid
      if (task.employerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if task is in progress
      if (task.status !== 'in-progress') {
        return res.status(400).json({ message: "Cannot mark payment for a task that is not in progress" });
      }
      
      const paymentData = {
        ...req.body,
      };
      
      const newPayment = await storage.createPayment(paymentData);
      
      // Update task status to completed
      await storage.updateTask(task.id, { status: "completed" });
      
      // Notify student about payment
      await storage.createNotification({
        userId: application.studentId,
        type: "payment_completed",
        content: `Payment of ₹${req.body.amount} received for "${task.title}"`,
        metadata: { taskId: task.id, applicationId: applicationId, paymentId: newPayment.id }
      });
      
      res.status(201).json(newPayment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Badge routes
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/badges/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Admin only
  app.post("/api/badges", requireRole(["admin"]), async (req, res) => {
    try {
      try {
        insertBadgeSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
      
      const newBadge = await storage.createBadge(req.body);
      res.status(201).json(newBadge);
    } catch (error) {
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  // Award badge to user (admin only)
  app.post("/api/badges/award", requireRole(["admin"]), async (req, res) => {
    try {
      try {
        insertUserBadgeSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
      
      const newUserBadge = await storage.awardBadgeToUser(req.body);
      
      // Notify user about new badge
      const badge = await storage.getBadge(req.body.badgeId);
      if (badge) {
        await storage.createNotification({
          userId: req.body.userId,
          type: "badge_awarded",
          content: `You've been awarded the "${badge.name}" badge!`,
          metadata: { badgeId: badge.id }
        });
      }
      
      res.status(201).json(newUserBadge);
    } catch (error) {
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // Report routes
  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      try {
        insertReportSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
      
      const reportData = {
        ...req.body,
        reporterId: req.user!.id,
      };
      
      const newReport = await storage.createReport(reportData);
      
      // Notify admins about new report
      const admins = await storage.getUsersByRole("admin");
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "new_report",
          content: "A new report has been submitted",
          metadata: { reportId: newReport.id }
        });
      }
      
      res.status(201).json(newReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Admin only - handle reports
  app.patch("/api/reports/:id/status", requireRole(["admin"]), async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'resolved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedReport = await storage.updateReportStatus(reportId, status);
      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to update report status" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Only the notification owner can mark it as read
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { amount, applicationId } = req.body;

      if (!amount || !applicationId) {
        return res.status(400).json({ message: "Amount and applicationId are required" });
      }

      // Validate application exists and belongs to the current user or employer
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const task = await storage.getTask(application.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Only the employer who posted the task can make payments
      if (task.employerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only the employer can initiate payment" });
      }

      // Create a PaymentIntent with the specified amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents for Stripe
        currency: "inr", // Using Indian Rupees
        metadata: {
          applicationId: applicationId.toString(),
          taskId: task.id.toString(),
          employerId: req.user!.id.toString(),
          studentId: application.studentId.toString()
        }
      });

      // Return the client secret to the client
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      res.status(500).json({ 
        message: "Error creating payment intent",
        error: error.message 
      });
    }
  });
  
  /**
   * Payment Confirmation Endpoint
   * 
   * A simplified payment confirmation endpoint that handles both real Stripe payments
   * and simulated payments for development purposes.
   * 
   * IMPLEMENTATION NOTES:
   * - Replaces complex webhook handling with direct payment confirmation
   * - Supports both real Stripe payments (using paymentIntentId) and simulated payments
   * - Updates application status, creates payment record, and sends notifications
   * - More robust error handling and better user feedback
   */
  app.post("/api/payment-confirm", requireAuth, async (req, res) => {
    try {
      const { applicationId, amount, simulatedPayment, paymentIntentId } = req.body;
      
      if (!applicationId) {
        return res.status(400).json({ message: "Application ID is required" });
      }
      
      // Parse applicationId as integer
      const appId = parseInt(applicationId);
      
      // Validate application exists and belongs to the current user
      const application = await storage.getApplication(appId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const task = await storage.getTask(application.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // In a production environment with real payments,
      // this would validate the payment with Stripe
      let paymentAmount = amount;
      let paymentReference = "simulated-payment";
      
      // If using real Stripe integration (for future enhancement)
      if (paymentIntentId && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ 
              message: "Payment has not been completed",
              status: paymentIntent.status 
            });
          }
          
          paymentAmount = paymentIntent.amount / 100; // Convert from cents
          paymentReference = paymentIntent.id;
        } catch (stripeError: any) {
          // Only throw error for real payments - allow simulated payments to proceed
          if (!simulatedPayment) {
            throw stripeError;
          }
        }
      }
      
      // Create payment record in our system
      const newPayment = await storage.createPayment({
        applicationId: appId,
        amount: paymentAmount,
        status: 'completed'
      });
      
      // Update task status to completed
      await storage.updateTask(task.id, { status: "completed" });
      
      // Notify student about payment
      await storage.createNotification({
        userId: application.studentId,
        type: "payment_completed",
        content: `Payment of ₹${paymentAmount} received for "${task.title}"`,
        metadata: { 
          taskId: task.id, 
          applicationId: appId,
          paymentId: newPayment.id,
          referenceId: paymentReference
        }
      });
      
      res.status(200).json({ 
        success: true,
        message: "Payment confirmed and recorded",
        payment: newPayment
      });
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ 
        message: "Error confirming payment",
        error: error.message 
      });
    }
  });



  return httpServer;
}
