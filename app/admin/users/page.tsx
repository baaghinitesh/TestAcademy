'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  UserCheck,
  UserX,
  RefreshCcw,
  Download,
  Calendar,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  class?: number;
  profilePicture?: string;
  enrolledSubjects?: string[];
  isActive: boolean;
  lastActive?: string;
  createdAt: string;
  stats?: {
    testsAttempted: number;
    averageScore: number;
    totalTimeSpent: number;
    completionRate: number;
  };
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const classes = [5, 6, 7, 8, 9, 10];

  useEffect(() => {
    fetchUsers();
  }, [selectedClass, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      let url = '/api/user';
      const params = new URLSearchParams();
      
      if (selectedClass !== 'all') {
        params.append('class', selectedClass);
      }
      if (selectedRole !== 'all') {
        params.append('role', selectedRole);
      }
      if (selectedStatus !== 'all') {
        params.append('isActive', selectedStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Mock stats for demo purposes
        const usersWithStats = (data.users || []).map((user: User) => ({
          ...user,
          stats: {
            testsAttempted: Math.floor(Math.random() * 50),
            averageScore: Math.floor(Math.random() * 30) + 70,
            totalTimeSpent: Math.floor(Math.random() * 1000) + 100,
            completionRate: Math.floor(Math.random() * 30) + 70
          }
        }));
        setUsers(usersWithStats);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/user/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (response.ok) {
        setUsers(users.map(user => 
          user._id === id ? { ...user, isActive: !currentStatus } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const resetUserPassword = async (id: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;
    
    try {
      const response = await fetch(`/api/user/${id}/reset-password`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Password reset successfully. New password sent to user email.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Manage students and their accounts
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Users
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls.toString()}>Class {cls}</option>
              ))}
            </select>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            
            <Button variant="outline" onClick={fetchUsers}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(user => user.role === 'student').length}
            </div>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(user => user.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(user => user.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p>Try adjusting your search criteria.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profilePicture} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {user.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                            {user.role}
                          </Badge>
                          {user.class && (
                            <Badge variant="secondary">Class {user.class}</Badge>
                          )}
                          <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-xs font-medium ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {user.role === 'student' && user.enrolledSubjects && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">Subjects:</span>
                          {user.enrolledSubjects.map(subject => (
                            <Badge key={subject} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {user.role === 'student' && user.stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span>{user.stats.testsAttempted} tests</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            <span>{user.stats.averageScore}% avg</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimeSpent(user.stats.totalTimeSpent)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{user.stats.completionRate}% completion</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.lastActive && (
                          <span>
                            <strong>Last seen:</strong> {new Date(user.lastActive).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={user.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        {user.role === 'student' && (
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            View Performance
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => resetUserPassword(user._id)}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}