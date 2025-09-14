# User Support System Integration Guide

## Overview
The JJ-Essential platform includes a comprehensive customer support system that allows users to create support tickets, communicate with support staff, and track their issues. This guide covers how users (customers) can interact with the support system through the frontend.

## System Architecture

### Available Endpoints for Users
The customer support system provides both user-facing and admin-facing endpoints:

**User Endpoints** (for customers):
- `POST /customer-support/chat` - Create a new support ticket
- `GET /customer-support/my-chats` - Get user's support tickets
- `GET /customer-support/chat/:chatId` - Get specific chat details
- `POST /customer-support/chat/:chatId/message` - Send a message to support

**Admin Endpoints** (for support staff):
- `GET /customer-support/admin/chats` - Get all support tickets
- `PUT /customer-support/admin/chat/:chatId/status` - Update ticket status
- `PUT /customer-support/admin/chat/:chatId/assign` - Assign ticket to support staff
- `GET /customer-support/admin/stats` - Get support statistics

## User API Integration

### TypeScript Interfaces

```typescript
// User-facing support ticket types
export interface UserSupportTicket {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  messages: Array<{
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
    sender: {
      id: string;
      email: string;
      fullName: string;
    };
  }>;
  _count: {
    messages: number;
  };
}

export interface CreateSupportTicketDto {
  subject: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  initialMessage: string;
}

export interface SendMessageDto {
  message: string;
}

export interface SupportTicketDetail {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  messages: Array<{
    id: string;
    chatId: string;
    senderId: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
    sender: {
      id: string;
      email: string;
      fullName: string;
    };
  }>;
}
```

### User Support API Client

```typescript
import { get, post } from './apiClient';

const userSupportApi = {
  /**
   * Create a new support ticket
   * POST /customer-support/chat
   */
  createTicket: async (ticketData: CreateSupportTicketDto): Promise<UserSupportTicket> => {
    try {
      const response = await post<UserSupportTicket>('/customer-support/chat', ticketData);
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to create support ticket');
      }
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create support ticket');
    }
  },

  /**
   * Get user's support tickets
   * GET /customer-support/my-chats
   */
  getMyTickets: async (): Promise<UserSupportTicket[]> => {
    try {
      const response = await get<UserSupportTicket[]>('/customer-support/my-chats');
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to fetch support tickets');
      }
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch support tickets');
    }
  },

  /**
   * Get support ticket details with full conversation
   * GET /customer-support/chat/:chatId
   */
  getTicketDetails: async (ticketId: string): Promise<SupportTicketDetail> => {
    try {
      const response = await get<SupportTicketDetail>(`/customer-support/chat/${ticketId}`);
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to fetch ticket details');
      }
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch ticket details');
    }
  },

  /**
   * Send a message to support ticket
   * POST /customer-support/chat/:chatId/message
   */
  sendMessage: async (ticketId: string, messageData: SendMessageDto): Promise<any> => {
    try {
      const response = await post(`/customer-support/chat/${ticketId}/message`, messageData);
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to send message');
    }
  }
};

export default userSupportApi;
```

## Frontend React Integration

### 1. Support Ticket List Component

```typescript
import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import userSupportApi, { UserSupportTicket } from '../services/userSupportApi';

const SupportTicketList: React.FC = () => {
  const [tickets, setTickets] = useState<UserSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTickets = await userSupportApi.getMyTickets();
      setTickets(fetchedTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'CLOSED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          My Support Tickets
        </h3>
        
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No support tickets</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't created any support tickets yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => window.location.href = `/support/ticket/${ticket.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(ticket.status)}
                    <h4 className="text-sm font-medium text-gray-900">
                      {ticket.subject}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-sm text-gray-500">
                      {ticket._count.messages} messages
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Status: <span className="font-medium">{ticket.status}</span>
                  <span className="mx-2">•</span>
                  Created: {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketList;
```

### 2. Create Support Ticket Component

```typescript
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import userSupportApi, { CreateSupportTicketDto } from '../services/userSupportApi';

interface CreateSupportTicketProps {
  onTicketCreated: () => void;
  onCancel: () => void;
}

const CreateSupportTicket: React.FC<CreateSupportTicketProps> = ({ 
  onTicketCreated, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<CreateSupportTicketDto>({
    subject: '',
    priority: 'MEDIUM',
    initialMessage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.initialMessage.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await userSupportApi.createTicket(formData);
      onTicketCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Create Support Ticket
        </h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Brief description of your issue"
              required
            />
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message *
            </label>
            <textarea
              id="message"
              rows={4}
              value={formData.initialMessage}
              onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Please describe your issue in detail..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSupportTicket;
```

### 3. Support Ticket Chat Component

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Headphones } from 'lucide-react';
import userSupportApi, { SupportTicketDetail, SendMessageDto } from '../services/userSupportApi';

interface SupportTicketChatProps {
  ticketId: string;
}

const SupportTicketChat: React.FC<SupportTicketChatProps> = ({ ticketId }) => {
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const ticketDetails = await userSupportApi.getTicketDetails(ticketId);
      setTicket(ticketDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const messageData: SendMessageDto = { message: newMessage };
      
      await userSupportApi.sendMessage(ticketId, messageData);
      setNewMessage('');
      
      // Refresh ticket details to show new message
      await fetchTicketDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'OPEN': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'CLOSED': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {ticket.subject}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Ticket ID: {ticket.id}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(ticket.status)}
            <span className="text-sm text-gray-500">
              Priority: {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isAdmin ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isAdmin 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'bg-indigo-600 text-white'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  {message.isAdmin ? (
                    <Headphones className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">
                    {message.isAdmin ? 'Support' : 'You'}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {ticket.status !== 'CLOSED' && (
        <div className="px-4 py-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Type your message..."
                disabled={sendingMessage}
              />
            </div>
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
      
      {ticket.status === 'CLOSED' && (
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            This ticket has been closed. If you need further assistance, please create a new ticket.
          </p>
        </div>
      )}
    </div>
  );
};

export default SupportTicketChat;
```

## Usage Examples

### 1. Creating a Support Ticket
```typescript
// In your React component
const handleCreateTicket = async () => {
  try {
    const newTicket = await userSupportApi.createTicket({
      subject: "Product delivery issue",
      priority: "HIGH",
      initialMessage: "I haven't received my order that was supposed to arrive yesterday. Order ID: 123456"
    });
    
    console.log('Ticket created:', newTicket);
    // Redirect to ticket details or refresh ticket list
  } catch (error) {
    console.error('Failed to create ticket:', error);
  }
};
```

### 2. Fetching User's Tickets
```typescript
// In your React component
const [tickets, setTickets] = useState<UserSupportTicket[]>([]);

useEffect(() => {
  const fetchTickets = async () => {
    try {
      const userTickets = await userSupportApi.getMyTickets();
      setTickets(userTickets);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };
  
  fetchTickets();
}, []);
```

### 3. Sending a Message
```typescript
// In your ticket chat component
const handleSendMessage = async (ticketId: string, message: string) => {
  try {
    await userSupportApi.sendMessage(ticketId, { message });
    // Refresh the ticket details to show the new message
    await fetchTicketDetails();
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

## Backend API Responses

### Create Ticket Response
```json
{
  "id": "ticket-uuid",
  "subject": "Product delivery issue",
  "status": "OPEN",
  "priority": "HIGH",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "assignedTo": null,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "messages": [
    {
      "id": "message-uuid",
      "chatId": "ticket-uuid",
      "senderId": "user-uuid",
      "message": "I haven't received my order...",
      "isAdmin": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "sender": {
        "id": "user-uuid",
        "email": "user@example.com",
        "fullName": "John Doe"
      }
    }
  ]
}
```

### Get My Tickets Response
```json
[
  {
    "id": "ticket-uuid-1",
    "subject": "Product delivery issue",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z",
    "assignedTo": "support-user-uuid",
    "messages": [
      {
        "id": "latest-message-uuid",
        "message": "We're looking into your delivery issue...",
        "isAdmin": true,
        "createdAt": "2024-01-15T14:20:00Z",
        "sender": {
          "fullName": "Support Agent"
        }
      }
    ],
    "_count": {
      "messages": 3
    }
  }
]
```

## Security & Authentication

### Required Headers
All API requests require authentication:
```typescript
// Headers automatically handled by apiClient
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Access Control
- Users can only see and interact with their own support tickets
- Users cannot change ticket status or priority (only support staff can)
- Users can only send messages to their own tickets

## Integration Checklist

### Frontend Requirements
- [ ] Install and configure API client
- [ ] Implement user authentication
- [ ] Create support ticket list component
- [ ] Create support ticket creation form
- [ ] Create support ticket chat interface
- [ ] Add error handling and loading states
- [ ] Add responsive design for mobile devices

### Backend Requirements
- [x] Customer support endpoints implemented
- [x] Authentication and authorization
- [x] Database tables (supportChat, chatMessage)
- [x] User access controls
- [x] Admin endpoints for support staff

## Best Practices

### User Experience
1. **Real-time Updates**: Consider implementing WebSocket connections for real-time message updates
2. **Offline Support**: Cache tickets locally for offline viewing
3. **File Attachments**: Consider adding file upload capability for screenshots/documents
4. **Push Notifications**: Notify users when support staff replies
5. **Search & Filter**: Add search functionality for users with many tickets

### Performance
1. **Pagination**: Implement pagination for users with many tickets
2. **Message Batching**: Load messages in batches for long conversations
3. **Caching**: Cache ticket data to reduce API calls
4. **Optimistic Updates**: Update UI immediately when sending messages

### Security
1. **Input Validation**: Sanitize all user inputs
2. **Rate Limiting**: Prevent spam by limiting message frequency
3. **Content Filtering**: Filter inappropriate content
4. **Audit Logging**: Log all support interactions for compliance

This guide provides a comprehensive overview of how users can interact with the support system. The existing backend implementation supports all the necessary functionality for a full-featured customer support experience.