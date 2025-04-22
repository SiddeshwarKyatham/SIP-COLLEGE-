import { 
  users, type User, type InsertUser,
  tasks, type Task, type InsertTask,
  applications, type Application, type InsertApplication,
  messages, type Message, type InsertMessage,
  payments, type Payment, type InsertPayment,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  reports, type Report, type InsertReport,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  
  // Task related methods
  getTask(id: number): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByEmployerId(employerId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task>;
  
  // Application related methods
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByTaskId(taskId: number): Promise<Application[]>;
  getApplicationsByStudentId(studentId: number): Promise<Application[]>;
  getApplicationByStudentAndTask(studentId: number, taskId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;
  
  // Message related methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByApplicationId(applicationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Payment related methods
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByApplicationId(applicationId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Badge related methods
  getBadge(id: number): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: number): Promise<(Badge & { awardedAt: Date })[]>;
  awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge>;
  
  // Report related methods
  getReport(id: number): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReportStatus(id: number, status: string): Promise<Report>;
  
  // Notification related methods
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private applications: Map<number, Application>;
  private messages: Map<number, Message>;
  private payments: Map<number, Payment>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  private reports: Map<number, Report>;
  private notifications: Map<number, Notification>;
  
  currentUserId: number;
  currentTaskId: number;
  currentApplicationId: number;
  currentMessageId: number;
  currentPaymentId: number;
  currentBadgeId: number;
  currentUserBadgeId: number;
  currentReportId: number;
  currentNotificationId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.applications = new Map();
    this.messages = new Map();
    this.payments = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    this.reports = new Map();
    this.notifications = new Map();
    
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentApplicationId = 1;
    this.currentMessageId = 1;
    this.currentPaymentId = 1;
    this.currentBadgeId = 1;
    this.currentUserBadgeId = 1;
    this.currentReportId = 1;
    this.currentNotificationId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize some badges
    this.createBadge({
      name: "JavaScript",
      description: "JavaScript programming skills",
      category: "skill",
      level: "beginner",
      icon: "code",
    });
    
    this.createBadge({
      name: "UI Design",
      description: "User Interface design skills",
      category: "skill",
      level: "beginner",
      icon: "palette",
    });
    
    this.createBadge({
      name: "Python",
      description: "Python programming skills",
      category: "skill",
      level: "beginner",
      icon: "code",
    });
    
    this.createBadge({
      name: "First Task Completed",
      description: "Completed your first task",
      category: "achievement",
      level: "beginner",
      icon: "award",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = {
      ...insertUser,
      id,
      skills: insertUser.skills || [],
      createdAt,
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  async getTasksByEmployerId(employerId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.employerId === employerId
    );
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const createdAt = new Date();
    const task: Task = {
      ...insertTask,
      id,
      createdAt,
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Application methods
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async getApplicationsByTaskId(taskId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.taskId === taskId
    );
  }
  
  async getApplicationsByStudentId(studentId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.studentId === studentId
    );
  }
  
  async getApplicationByStudentAndTask(studentId: number, taskId: number): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(
      (application) => application.studentId === studentId && application.taskId === taskId
    );
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const appliedAt = new Date();
    const application: Application = {
      ...insertApplication,
      id,
      appliedAt,
    };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const application = await this.getApplication(id);
    if (!application) {
      throw new Error(`Application with ID ${id} not found`);
    }
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByApplicationId(applicationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.applicationId === applicationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt,
      isRead: false,
    };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<Message> {
    const message = await this.getMessage(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getPaymentsByApplicationId(applicationId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.applicationId === applicationId
    );
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const createdAt = new Date();
    const payment: Payment = {
      ...insertPayment,
      id,
      createdAt,
    };
    this.payments.set(id, payment);
    return payment;
  }
  
  // Badge methods
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = this.currentBadgeId++;
    const badge: Badge = {
      ...insertBadge,
      id,
    };
    this.badges.set(id, badge);
    return badge;
  }
  
  async getUserBadges(userId: number): Promise<(Badge & { awardedAt: Date })[]> {
    const userBadgesIds = Array.from(this.userBadges.values())
      .filter((userBadge) => userBadge.userId === userId)
      .map((userBadge) => ({
        badgeId: userBadge.badgeId,
        awardedAt: userBadge.awardedAt
      }));
    
    const userBadgesWithDetails = [];
    
    for (const { badgeId, awardedAt } of userBadgesIds) {
      const badge = await this.getBadge(badgeId);
      if (badge) {
        userBadgesWithDetails.push({
          ...badge,
          awardedAt
        });
      }
    }
    
    return userBadgesWithDetails;
  }
  
  async awardBadgeToUser(insertUserBadge: InsertUserBadge): Promise<UserBadge> {
    // Check if user already has this badge
    const existingUserBadge = Array.from(this.userBadges.values()).find(
      (userBadge) => userBadge.userId === insertUserBadge.userId && userBadge.badgeId === insertUserBadge.badgeId
    );
    
    if (existingUserBadge) {
      return existingUserBadge;
    }
    
    const id = this.currentUserBadgeId++;
    const awardedAt = new Date();
    const userBadge: UserBadge = {
      ...insertUserBadge,
      id,
      awardedAt,
    };
    this.userBadges.set(id, userBadge);
    return userBadge;
  }
  
  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }
  
  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }
  
  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const createdAt = new Date();
    const report: Report = {
      ...insertReport,
      id,
      createdAt,
    };
    this.reports.set(id, report);
    return report;
  }
  
  async updateReportStatus(id: number, status: string): Promise<Report> {
    const report = await this.getReport(id);
    if (!report) {
      throw new Error(`Report with ID ${id} not found`);
    }
    
    const updatedReport = { ...report, status };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }
  
  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const createdAt = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt,
      isRead: false,
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = await this.getNotification(id);
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

export const storage = new MemStorage();
