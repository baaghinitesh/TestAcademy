'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  MoreHorizontal,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ErrorBoundary } from '@/components/error-boundary';
import { apiClient } from '@/lib/api-client';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  class?: number;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  totalTests?: number;
  averageScore?: number;
}

interface ApiState {
  users: User[];
  loading: boolean;
  error: string | null;
}

interface FilterState {
  searchTerm: string;
  selectedRole: string;
  selectedClass: string;
  selectedStatus: string;
}

// Safe API call wrapper
const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  onError?: (error: any) => void
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API call failed:', error);
    onError?.(error);
    return fallback;
  }
};

// Loading component
const LoadingSpinner = () => (
  <ErrorBoundary fallback={<div className="text-center p-4">Loading failed</div>}>
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading users...</p>
      </div>
    </div>
  </ErrorBoundary>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <ErrorBoundary fallback={<div className="text-center p-4">Error display failed</div>}>
    <Card className="border-red-200">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Users</h3>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </ErrorBoundary>
);

// Safe stats component
const UserStats = ({ users }: { users: User[] }) => (
  <ErrorBoundary fallback={<div className="grid gap-4 md:grid-cols-4"><div className="text-center p-4">Stats unavailable</div></div>}>
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-foreground">{users?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {users?.filter(user => user?.role === 'student')?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">Students</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {users?.filter(user => user?.role === 'admin')?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">Admins</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {users?.filter(user => user?.status === 'active')?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>
    </div>
  </ErrorBoundary>
);

// Safe user item component
const UserItem = ({ 
  user, 
  onStatusUpdate, 
  onDelete 
}: { 
  user: User; 
  onStatusUpdate: (id: string, status: string) => void; 
  onDelete: (id: string) => void; 
}) => {
  const formatDate = (dateString?: string) => {
    try {
      if (!dateString) return 'Never';
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ErrorBoundary fallback={<Card><CardContent className="p-4">User item unavailable</CardContent></Card>}>
      <Card key={user?._id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={getRoleColor(user?.role || 'student')}>
                  {user?.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                  {user?.role || 'Unknown'}
                </Badge>
                <Badge className={getStatusColor(user?.status || 'inactive')}>
                  {user?.status || 'Unknown'}
                </Badge>
                {user?.class && (
                  <Badge variant="outline">Class {user.class}</Badge>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {user?.name || 'Unknown User'}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email || 'No email'}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined: {formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              {user?.role === 'student' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">
                    <span className="font-medium">Tests:</span> {user?.totalTests || 0}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium">Avg Score:</span> {user?.averageScore?.toFixed(1) || '0.0'}%
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Last Login: {formatDate(user?.lastLogin)}
              </div>
            </div>
            
            <ErrorBoundary fallback={<div className="text-sm text-muted-foreground">Actions unavailable</div>}>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    {user?.status !== 'active' && (
                      <DropdownMenuItem 
                        className="flex items-center gap-2 text-green-600"
                        onClick={() => onStatusUpdate(user?._id || '', 'active')}
                      >
                        <Shield className="h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    {user?.status === 'active' && (
                      <DropdownMenuItem 
                        className="flex items-center gap-2 text-orange-600"
                        onClick={() => onStatusUpdate(user?._id || '', 'suspended')}
                      >
                        <Shield className="h-4 w-4" />
                        Suspend
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-red-600"
                      onClick={() => onDelete(user?._id || '')}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ErrorBoundary>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default function UsersManagement() {
  const [apiState, setApiState] = useState<ApiState>({
    users: [],
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedRole: 'all',
    selectedClass: 'all',
    selectedStatus: 'all'
  });

  const classes = [5, 6, 7, 8, 9, 10];

  const fetchUsers = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        let url = '/api/users';
        const params = new URLSearchParams();
        
        if (filters.selectedRole !== 'all') params.append('role', filters.selectedRole);
        if (filters.selectedClass !== 'all') params.append('class', filters.selectedClass);
        if (filters.selectedStatus !== 'all') params.append('status', filters.selectedStatus);
        
        if (params.toString()) url += `?${params.toString()}`;

        const response = await apiClient.get(url);
        return response.data?.users || [];
      },
      [],
      (error) => {
        setApiState(prev => ({ 
          ...prev, 
          error: error?.message || 'Failed to fetch users. Please check your connection and try again.' 
        }));
      }
    );

    setApiState(prev => ({
      ...prev,
      users: result,
      loading: false
    }));
  }, [filters.selectedRole, filters.selectedClass, filters.selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = async (id: string, status: string) => {
    if (!id) return;

    await safeApiCall(
      async () => {
        await apiClient.patch(`/api/users/${id}`, { status });
        setApiState(prev => ({
          ...prev,
          users: prev.users.map(user => 
            user._id === id ? { ...user, status: status as any } : user
          )
        }));
      },
      null,
      () => {
        console.error('Failed to update user status');
      }
    );
  };

  const deleteUser = async (id: string) => {
    if (!id || !confirm('Are you sure you want to delete this user?')) return;
    
    await safeApiCall(
      async () => {
        await apiClient.delete(`/api/users/${id}`);
        setApiState(prev => ({
          ...prev,
          users: prev.users.filter(user => user._id !== id)
        }));
      },
      null,
      () => {
        console.error('Failed to delete user');
      }
    );
  };

  const filteredUsers = apiState.users.filter(user => {
    if (!user) return false;
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(searchLower) || false) ||
      (user.email?.toLowerCase().includes(searchLower) || false) ||
      (user.phone?.toLowerCase().includes(searchLower) || false)
    );
  });

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchUsers} />;
  }

  return (
    <ErrorBoundary fallback={<div className="text-center p-8">Users management is temporarily unavailable</div>}>
      <div className="space-y-6">
        {/* Header */}
        <ErrorBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">
                Manage students and admin users
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          </div>
        </ErrorBoundary>

        {/* Filters and Search */}
        <ErrorBoundary fallback={<Card><CardContent className="p-4">Filters unavailable</CardContent></Card>}>
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
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filters.selectedRole}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedRole: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Admins</option>
                </select>
                
                <select
                  value={filters.selectedClass}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedClass: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls.toString()}>Class {cls}</option>
                  ))}
                </select>
                
                <select
                  value={filters.selectedStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedStatus: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                
                <Button variant="outline" onClick={fetchUsers}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Stats */}
        <UserStats users={apiState.users} />

        {/* Users List */}
        <ErrorBoundary fallback={<Card><CardContent className="p-8 text-center">User list unavailable</CardContent></Card>}>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No users found</h3>
                    <p>Try adjusting your search criteria or add a new user.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <UserItem
                  key={user?._id || Math.random()}
                  user={user}
                  onStatusUpdate={updateUserStatus}
                  onDelete={deleteUser}
                />
              ))
            )}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}