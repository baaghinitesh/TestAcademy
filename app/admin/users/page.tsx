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
const safeApiCall = async <T,>(
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
      return dateString ? new Date(dateString).toLocaleDateString() : 'Never';
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  return (
    <ErrorBoundary fallback={<Card><CardContent className="p-4">User item unavailable</CardContent></Card>}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {getRoleIcon(user?.role)}
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                    {user?.role === 'admin' ? 'Admin' : 'Student'}
                  </Badge>
                </div>
                {user?.class && (
                  <Badge variant="outline">Class {user.class}</Badge>
                )}
                <Badge variant="secondary" className={getStatusColor(user?.status)}>
                  {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
                </Badge>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {user?.name || 'Unknown User'}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{user?.email || 'No email'}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined: {formatDate(user?.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <span>Last Login: {formatDate(user?.lastLogin)}</span>
                </div>
                {user?.role === 'student' && (
                  <>
                    <div>
                      <span>Tests: {user?.totalTests || 0}</span>
                    </div>
                    <div>
                      <span>Avg Score: {user?.averageScore?.toFixed(1) || '0.0'}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(`/admin/users/${user?._id}/edit`, '_blank')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
                {user?.status === 'active' ? (
                  <DropdownMenuItem onClick={() => onStatusUpdate(user?._id, 'suspended')}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Suspend User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onStatusUpdate(user?._id, 'active')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Activate User
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(user?._id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

  const fetchUsers = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        const params = new URLSearchParams({
          role: filters.selectedRole,
          class: filters.selectedClass,
          status: filters.selectedStatus
        });

        const response = await apiClient.get(`/api/users?${params.toString()}`);
        return response.data || [];
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
    
    const matchesSearch = !filters.searchTerm || 
      user.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchUsers} />;
  }

  return (
    <ErrorBoundary fallback={<div className="text-center p-8">User management is temporarily unavailable</div>}>
      <div className="space-y-6">
        {/* Header */}
        <ErrorBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">
                Manage students, admins, and user accounts
              </p>
            </div>
            
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </ErrorBoundary>

        {/* Stats */}
        <UserStats users={apiState.users} />

        {/* Filters */}
        <ErrorBoundary fallback={<Card><CardContent className="p-4">Filters unavailable</CardContent></Card>}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
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
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
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
                
                <Button 
                  onClick={fetchUsers}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Users List */}
        <ErrorBoundary fallback={<div className="text-center p-8">Users list unavailable</div>}>
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground mb-6">
                  {apiState.users.length === 0 
                    ? "No users have been registered yet."
                    : "No users match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add First User
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <UserItem 
                  key={user._id}
                  user={user} 
                  onStatusUpdate={updateUserStatus}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}