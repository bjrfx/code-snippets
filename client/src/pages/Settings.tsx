import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useFontSize } from '@/hooks/use-font-size';
import { useLocation } from 'wouter';
import { ChevronLeft, Download, Upload, Trash2, FileDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { collection, query, where, getDocs, doc, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BackupFile {
  id: string;
  fileName: string;
  timestamp: number;
  downloadUrl: string;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backup files when component mounts
  useEffect(() => {
    if (user) {
      fetchBackupFiles();
    }
  }, [user]);

  // Fetch backup files from Firebase
  const fetchBackupFiles = async () => {
    if (!user) return;
    
    try {
      setIsLoadingBackups(true);
      
      // Query the backups collection for this user
      const backupsQuery = query(
        collection(db, 'backups'),
        where('userId', '==', user.uid)
      );
      
      const backupsSnapshot = await getDocs(backupsQuery);
      const backupsData = backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BackupFile[];
      
      setBackupFiles(backupsData);
    } catch (error: any) {
      console.error('Error fetching backup files:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load backup files.'
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    try {
      // This will update the font size in real-time and save to Firebase
      setFontSize(value[0]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update font size. Please try again.'
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      setIsExporting(true);
      
      // Collect all user data from Firebase
      const userData: Record<string, any> = {
        snippets: [],
        notes: [],
        checklists: [],
        projects: [],
        profile: {}
      };
      
      // Fetch user profile
      const userDocRef = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userDocRef.empty) {
        userData.profile = userDocRef.docs[0].data();
      }
      
      // Fetch snippets
      const snippetsQuery = query(collection(db, 'snippets'), where('userId', '==', user.uid));
      const snippetsSnapshot = await getDocs(snippetsQuery);
      userData.snippets = snippetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch notes
      const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const notesSnapshot = await getDocs(notesQuery);
      userData.notes = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch checklists
      const checklistsQuery = query(collection(db, 'checklists'), where('userId', '==', user.uid));
      const checklistsSnapshot = await getDocs(checklistsQuery);
      userData.checklists = checklistsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch projects
      const projectsQuery = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const projectsSnapshot = await getDocs(projectsQuery);
      userData.projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Create a JSON file and trigger download
      const timestamp = new Date();
      const fileName = `snippets-backup-${timestamp.toISOString().split('T')[0]}.json`;
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `backups/${user.uid}/${fileName}`);
      await uploadBytes(storageRef, dataBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Save backup metadata to Firestore
      const backupRef = await addDoc(collection(db, 'backups'), {
        userId: user.uid,
        fileName,
        timestamp: timestamp.getTime(),
        downloadUrl,
        createdAt: timestamp.getTime()
      });
      
      // Add to local state
      setBackupFiles([...backupFiles, {
        id: backupRef.id,
        fileName,
        timestamp: timestamp.getTime(),
        downloadUrl
      }]);
      
      // Create download link for user
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Your data has been exported and saved to your account.'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message || 'Failed to export your data. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBackup = async (backupFile: BackupFile) => {
    try {
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = backupFile.downloadUrl;
      link.download = backupFile.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download Started',
        description: 'Your backup file download has started.'
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error.message || 'Failed to download backup file.'
      });
    }
  };

  const handleDeleteBackup = async (backupFile: BackupFile) => {
    if (!user) return;
    
    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, `backups/${user.uid}/${backupFile.fileName}`);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'backups', backupFile.id));
      
      // Remove from local state
      setBackupFiles(backupFiles.filter(file => file.id !== backupFile.id));
      
      toast({
        title: 'Backup Deleted',
        description: 'Your backup file has been deleted.'
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete backup file.'
      });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    try {
      setIsImporting(true);
      const file = e.target.files[0];
      
      // Read the file
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) throw new Error('Failed to read file');
          
          // Parse the JSON data
          const importedData = JSON.parse(event.target.result as string);
          
          // Validate the data structure
          if (!importedData.snippets || !importedData.notes || !importedData.checklists) {
            throw new Error('Invalid backup file format. The file is missing required data structures.');
          }
          
          // Import data to Firebase
          const batch = writeBatch(db);
          let importCount = 0;
          
          // Import snippets
          for (const snippet of importedData.snippets) {
            // Ensure the snippet belongs to the current user
            if (snippet.userId === user.uid) {
              const snippetRef = doc(db, 'snippets', snippet.id);
              batch.set(snippetRef, {
                ...snippet,
                updatedAt: new Date().getTime() // Update the timestamp
              });
              importCount++;
            }
          }
          
          // Import notes
          for (const note of importedData.notes) {
            if (note.userId === user.uid) {
              const noteRef = doc(db, 'notes', note.id);
              batch.set(noteRef, {
                ...note,
                updatedAt: new Date().getTime()
              });
              importCount++;
            }
          }
          
          // Import checklists
          for (const checklist of importedData.checklists) {
            if (checklist.userId === user.uid) {
              const checklistRef = doc(db, 'checklists', checklist.id);
              batch.set(checklistRef, {
                ...checklist,
                updatedAt: new Date().getTime()
              });
              importCount++;
            }
          }
          
          // Import projects if they exist in the backup
          if (importedData.projects && Array.isArray(importedData.projects)) {
            for (const project of importedData.projects) {
              if (project.userId === user.uid) {
                const projectRef = doc(db, 'projects', project.id);
                batch.set(projectRef, {
                  ...project,
                  updatedAt: new Date().getTime()
                });
                importCount++;
              }
            }
          }
          
          // Commit the batch
          await batch.commit();
          
          toast({
            title: 'Import Successful',
            description: `Successfully imported ${importCount} items to your account.`
          });
        } catch (error: any) {
          console.error('Import parsing error:', error);
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error.message || 'Failed to import your data. Please check the file format.'
          });
        } finally {
          setIsImporting(false);
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'Failed to read the file. Please try again.'
        });
        setIsImporting(false);
      };
      
      reader.readAsText(file);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error.message || 'Failed to import your data. Please try again.'
      });
      setIsImporting(false);
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Theme</Label>
              <ThemeSelector />
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Slider
                value={[fontSize]}
                max={20}
                min={12}
                step={1}
                className="w-full"
                onValueChange={handleFontSizeChange}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Backup & Restore Card */}
        <Card>
          <CardHeader>
            <CardTitle>Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Export your data to create a backup file that you can use to restore your snippets, notes, and checklists.
                When importing, make sure the file has the correct format.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleExportData}
                disabled={isExporting || !user}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={isImporting || !user}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/json"
                onChange={handleImportData}
              />
            </div>

            {/* Backup Files Table */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Your Backups</h3>
              
              {isLoadingBackups ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Loading your backups...</p>
                </div>
              ) : backupFiles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>{file.fileName}</TableCell>
                        <TableCell>{formatDate(file.timestamp)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadBackup(file)}
                              title="Download"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBackup(file)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 border rounded-md">
                  <p className="text-muted-foreground">No backups found. Export your data to create a backup.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}