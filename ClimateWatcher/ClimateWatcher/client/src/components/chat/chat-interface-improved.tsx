import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, InsertMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";

interface ChatInterfaceProps {
  applicationId: number;
  receiverId: number;
}

const ChatInterface = ({ applicationId, receiverId }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  
  // Connect to Socket.io
  useEffect(() => {
    // Only connect if we have the required props
    if (!applicationId || !user) return;
    
    // Connect to Socket.io server with correct protocol for Replit
    const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
    const hostname = window.location.host;
    const socketUrl = `${protocol}${hostname}`;
    console.log(`Connecting to Socket.io at: ${socketUrl}`);
    
    // Initialize Socket.io with optimized settings for Replit
    const socketIo = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      rejectUnauthorized: false, // Needed for Replit environment
      forceNew: true, // Force a new connection
      autoConnect: true,
      timeout: 30000 // Longer timeout for Replit environment
    });
    
    // Add connection status logging
    console.log("Attempting to connect to Socket.io server...");
    
    // Socket connection events
    socketIo.on('connect', () => {
      console.log("Socket.io connected:", socketIo.id);
      setSocketConnected(true);
      
      // Join room for this application
      socketIo.emit('join_application', applicationId);
      
      // Test connection with a ping
      socketIo.emit('ping', (response: any) => {
        console.log('Ping response:', response);
        setLastPingTime(response?.time || new Date().toISOString());
      });
      
      toast({
        title: "Real-time chat connected",
        description: "You'll receive messages instantly",
      });
    });
    
    // Listen for new messages
    socketIo.on('receive_message', (message) => {
      console.log("Received real-time message:", message);
      // Invalidate query to refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${applicationId}`] });
      
      // Play sound or show notification
      toast({
        title: "New message",
        variant: "default",
      });
    });
    
    // Listen for room join confirmation
    socketIo.on('room_joined', (data) => {
      console.log("Joined room:", data);
      toast({
        title: "Joined chat room",
        description: `Connected to conversation`,
      });
    });
    
    // Listen for message sent confirmation
    socketIo.on('message_sent', (data) => {
      console.log("Message sent confirmation:", data);
    });
    
    // Listen for server pong (connection test response)
    socketIo.on('pong', (data) => {
      console.log("Pong from server:", data);
      setLastPingTime(data?.time || new Date().toISOString());
    });
    
    // Socket error and disconnect handling
    socketIo.on('connect_error', (error) => {
      console.error("Socket.io connection error:", error);
      setSocketConnected(false);
      toast({
        title: "Connection error",
        description: "Unable to establish real-time connection",
        variant: "destructive",
      });
    });
    
    socketIo.on('disconnect', (reason) => {
      console.log("Socket.io disconnected:", reason);
      setSocketConnected(false);
      toast({
        title: "Disconnected",
        description: "Real-time chat connection lost",
        variant: "destructive",
      });
    });
    
    setSocket(socketIo);
    
    // Cleanup function
    return () => {
      console.log("Cleaning up Socket.io connection");
      socketIo.disconnect();
    };
  }, [applicationId, user]);
  
  // Fetch messages for this application
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${applicationId}`],
    enabled: applicationId > 0,
    refetchInterval: 10000, // Poll every 10 seconds as a backup
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: (newMessage) => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${applicationId}`] });
      
      // Also emit through Socket.io for real-time updates
      if (socket && socket.connected) {
        socket.emit('send_message', {
          applicationId,
          message: newMessage
        });
        console.log("Emitted message via Socket.io");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle message submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !user || !applicationId) return;
    
    sendMessageMutation.mutate({
      applicationId,
      senderId: user.id,
      receiverId,
      content: messageText.trim(),
    });
  };
  
  if (!applicationId || applicationId === 0) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center bg-gray-50 rounded-md">
        <p className="text-gray-500">No active conversation</p>
      </div>
    );
  }
  
  if (isMessagesLoading) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center bg-gray-50 rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }
  
  // Handle ping test
  const handlePingTest = () => {
    if (socket && socket.connected) {
      socket.emit('ping', (response: any) => {
        console.log('Manual ping response:', response);
        setLastPingTime(response?.time || new Date().toISOString());
        toast({
          title: "Connection test successful",
          description: "Real-time messaging is working",
        });
      });
    } else {
      toast({
        title: "Connection test failed",
        description: "Not connected to real-time service",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col h-[400px] border rounded-md bg-white">
      {/* Connection status indicator */}
      <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {socketConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-700">Real-time connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-700">Offline mode</span>
            </>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handlePingTest}
          className="text-xs"
        >
          Test connection
        </Button>
      </div>
      
      {/* Messages area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={chatContainerRef}
      >
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.senderId === user?.id;
            
            return (
              <div 
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p 
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-primary-100' : 'text-gray-500'
                    }`}
                  >
                    {format(new Date(message.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button 
            type="submit"
            disabled={sendMessageMutation.isPending || !messageText.trim()}
            size="icon"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;