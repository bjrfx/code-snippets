import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useLocation } from 'wouter';
import { ChevronLeft, Upload, Camera, User, Edit2, LogOut } from 'lucide-react';
import { useAuth, signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(userData.email || '');
          setDisplayName(userData.displayName || '');
          setProfileUrl(userData.profileUrl || null);
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load profile information.'
        });
      }
    };

    fetchUserProfile();
  }, [user, toast]);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const storage = getStorage();
    const storageRef = ref(storage, `profile-pics/${user.uid}`);
    
    try {
      setIsUploading(true);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update user document with profile picture URL
      await updateDoc(doc(db, 'users', user.uid), {
        profileUrl: downloadUrl
      });
      
      setProfileUrl(downloadUrl);
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully.'
      });
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload profile picture.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName
      });
      
      setIsEditingName(false);
      toast({
        title: 'Success',
        description: 'Display name updated successfully.'
      });
    } catch (error: any) {
      console.error('Error updating display name:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update display name.'
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!user || !email) return;
    
    try {
      await fetch(`/api/reset-password?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for instructions to reset your password.'
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send password reset email.'
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.'
      });
      setLocation('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out.'
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Profile Picture Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  {profileUrl ? (
                    <AvatarImage src={profileUrl} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {displayName ? displayName.charAt(0).toUpperCase() : <User />}
                    </AvatarFallback>
                  )}
                  <div 
                    className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </Avatar>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload New Picture'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSaveDisplayName} size="sm">
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingName(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 py-2 px-3 border rounded-md bg-muted/30">
                      {displayName || 'No display name set'}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="py-2 px-3 border rounded-md bg-muted/30">
                {email}
              </div>
            </div>

            {/* Password Reset */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={handlePasswordReset}
                className="w-full sm:w-auto"
              >
                Reset Password
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                A password reset link will be sent to your email address.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle>Sign Out</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You will be redirected to the login page after signing out.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}