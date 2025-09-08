'use client';

import { useState } from 'react';
import { 
  Save, 
  Settings as SettingsIcon, 
  Shield, 
  Mail, 
  Database,
  Palette,
  Bell,
  Lock,
  Globe,
  Trash2,
  Upload,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'EduTest LMS',
    platformDescription: 'Comprehensive Learning Management System',
    supportEmail: 'support@edutest.com',
    adminEmail: 'admin@edutest.com',
    
    // Test Settings
    defaultTestDuration: 60,
    maxTestDuration: 180,
    defaultMarksPerQuestion: 4,
    negativeMarking: true,
    negativeMarkingRatio: 0.25,
    autoSubmitOnTimeout: true,
    showResultsImmediately: false,
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialCharacters: true,
    twoFactorAuth: false,
    
    // Notification Settings
    emailNotifications: true,
    testCompletionNotifications: true,
    newUserNotifications: true,
    systemMaintenanceNotifications: true,
    
    // Content Settings
    allowFileUploads: true,
    maxFileSize: 50,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
    contentModeration: true,
    
    // UI Settings
    darkModeEnabled: true,
    customTheme: false,
    showBranding: true,
    customLogo: null
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (section?: string) => {
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${section ? section + ' ' : ''}Settings saved successfully!`);
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
        <Button 
          onClick={() => handleSave()} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Platform Name</label>
              <Input 
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                placeholder="Platform Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Support Email</label>
              <Input 
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Platform Description</label>
            <Input 
              value={settings.platformDescription}
              onChange={(e) => updateSetting('platformDescription', e.target.value)}
              placeholder="Brief description of your platform"
            />
          </div>
          
          <Button onClick={() => handleSave('General')} variant="outline" size="sm">
            Save General Settings
          </Button>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>Default test settings and scoring rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Duration (minutes)</label>
              <Input 
                type="number"
                value={settings.defaultTestDuration}
                onChange={(e) => updateSetting('defaultTestDuration', parseInt(e.target.value))}
                min="10"
                max="300"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Duration (minutes)</label>
              <Input 
                type="number"
                value={settings.maxTestDuration}
                onChange={(e) => updateSetting('maxTestDuration', parseInt(e.target.value))}
                min="30"
                max="600"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Default Marks Per Question</label>
              <Input 
                type="number"
                value={settings.defaultMarksPerQuestion}
                onChange={(e) => updateSetting('defaultMarksPerQuestion', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="negativeMarking"
                checked={settings.negativeMarking}
                onCheckedChange={(checked) => updateSetting('negativeMarking', checked)}
              />
              <label htmlFor="negativeMarking" className="text-sm font-medium">
                Enable Negative Marking
              </label>
            </div>
            
            {settings.negativeMarking && (
              <div className="ml-6">
                <label className="text-sm font-medium mb-2 block">Negative Marking Ratio</label>
                <Input 
                  type="number"
                  step="0.25"
                  value={settings.negativeMarkingRatio}
                  onChange={(e) => updateSetting('negativeMarkingRatio', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fraction of marks to deduct for wrong answers
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="autoSubmit"
                checked={settings.autoSubmitOnTimeout}
                onCheckedChange={(checked) => updateSetting('autoSubmitOnTimeout', checked)}
              />
              <label htmlFor="autoSubmit" className="text-sm font-medium">
                Auto-submit tests when time expires
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showResults"
                checked={settings.showResultsImmediately}
                onCheckedChange={(checked) => updateSetting('showResultsImmediately', checked)}
              />
              <label htmlFor="showResults" className="text-sm font-medium">
                Show results immediately after test completion
              </label>
            </div>
          </div>
          
          <Button onClick={() => handleSave('Test')} variant="outline" size="sm">
            Save Test Settings
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Authentication
          </CardTitle>
          <CardDescription>Platform security and user authentication settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Session Timeout (minutes)</label>
              <Input 
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Login Attempts</label>
              <Input 
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Min Password Length</label>
              <Input 
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                min="6"
                max="20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="specialChars"
                checked={settings.requireSpecialCharacters}
                onCheckedChange={(checked) => updateSetting('requireSpecialCharacters', checked)}
              />
              <label htmlFor="specialChars" className="text-sm font-medium">
                Require special characters in passwords
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="twoFactor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
              />
              <label htmlFor="twoFactor" className="text-sm font-medium">
                Enable Two-Factor Authentication
              </label>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </div>
          
          <Button onClick={() => handleSave('Security')} variant="outline" size="sm">
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure email and system notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium">
                Enable Email Notifications
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="testCompletion"
                checked={settings.testCompletionNotifications}
                onCheckedChange={(checked) => updateSetting('testCompletionNotifications', checked)}
              />
              <label htmlFor="testCompletion" className="text-sm font-medium">
                Notify on test completions
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="newUser"
                checked={settings.newUserNotifications}
                onCheckedChange={(checked) => updateSetting('newUserNotifications', checked)}
              />
              <label htmlFor="newUser" className="text-sm font-medium">
                Notify on new user registrations
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="maintenance"
                checked={settings.systemMaintenanceNotifications}
                onCheckedChange={(checked) => updateSetting('systemMaintenanceNotifications', checked)}
              />
              <label htmlFor="maintenance" className="text-sm font-medium">
                System maintenance notifications
              </label>
            </div>
          </div>
          
          <Button onClick={() => handleSave('Notification')} variant="outline" size="sm">
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Content & File Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Content & File Management
          </CardTitle>
          <CardDescription>File upload and content moderation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="allowUploads"
              checked={settings.allowFileUploads}
              onCheckedChange={(checked) => updateSetting('allowFileUploads', checked)}
            />
            <label htmlFor="allowUploads" className="text-sm font-medium">
              Allow file uploads
            </label>
          </div>
          
          {settings.allowFileUploads && (
            <div className="space-y-4 ml-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Max File Size (MB)</label>
                <Input 
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                  min="1"
                  max="500"
                  className="w-32"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Allowed File Types</label>
                <div className="flex gap-2 flex-wrap">
                  {settings.allowedFileTypes.map(type => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to modify allowed file types
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="contentModeration"
              checked={settings.contentModeration}
              onCheckedChange={(checked) => updateSetting('contentModeration', checked)}
            />
            <label htmlFor="contentModeration" className="text-sm font-medium">
              Enable content moderation
            </label>
          </div>
          
          <Button onClick={() => handleSave('Content')} variant="outline" size="sm">
            Save Content Settings
          </Button>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>Database and system maintenance actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Data Export</h4>
              <p className="text-sm text-muted-foreground">Export platform data for backup</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Users
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Tests
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Cache Management</h4>
              <p className="text-sm text-muted-foreground">Clear system caches</p>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Cache
              </Button>
            </div>
          </div>
          
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
            <p className="text-sm text-red-600 mb-3">
              These actions cannot be undone. Please proceed with caution.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm">
                Reset All Settings
              </Button>
              <Button variant="destructive" size="sm">
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}