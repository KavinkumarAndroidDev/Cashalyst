import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
// Importing the necessary libraries for file operations and document picking
class BackupService {
  constructor() {
    this.backupKey = 'cashalyst_backup';
    this.backupDir = `${FileSystem.documentDirectory}backups/`;
  }

  // Create backup from AsyncStorage data (saves to AsyncStorage only)
  async createBackup() {
    try {
      const transactions = await AsyncStorage.getItem('cashalyst_transactions');
      const accounts = await AsyncStorage.getItem('cashalyst_accounts');
      const username = await AsyncStorage.getItem('username');
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          transactions: transactions ? JSON.parse(transactions) : [],
          accounts: accounts ? JSON.parse(accounts) : [],
          username: username || ''
        }
      };
      await AsyncStorage.setItem(this.backupKey, JSON.stringify(backup));
      return backup;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  // Save backup to file system
  async saveBackupToFile(backup) {
    try {
      // Ensure backup directory exists
      await FileSystem.makeDirectoryAsync(this.backupDir, { intermediates: true });
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cashalyst_backup_${timestamp}.json`;
      const filePath = `${this.backupDir}${filename}`;
      // Write backup to file
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));
      return filePath;
    } catch (error) {
      console.error('Failed to save backup to file:', error);
      // Don't throw error here as AsyncStorage backup still works
    }
  }

  // Restore backup to AsyncStorage
  async restoreBackup() {
    try {
      const backupString = await AsyncStorage.getItem(this.backupKey);
      if (!backupString) {
        throw new Error('No backup found');
      }
      const backup = JSON.parse(backupString);
      await AsyncStorage.setItem('cashalyst_transactions', JSON.stringify(backup.data.transactions));
      await AsyncStorage.setItem('cashalyst_accounts', JSON.stringify(backup.data.accounts));
      if (backup.data.username !== undefined) {
        await AsyncStorage.setItem('username', backup.data.username);
      }
      return backup;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }

  // Restore from file
  async restoreFromFile(filePath) {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const backup = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backup.data || !backup.data.transactions || !backup.data.accounts) {
        throw new Error('Invalid backup file format');
      }

      // Restore data to AsyncStorage
      await AsyncStorage.setItem('cashalyst_transactions', JSON.stringify(backup.data.transactions));
      await AsyncStorage.setItem('cashalyst_accounts', JSON.stringify(backup.data.accounts));
      if (backup.data.username !== undefined) {
        await AsyncStorage.setItem('username', backup.data.username);
      }
      
      // Update the main backup reference
      await AsyncStorage.setItem(this.backupKey, fileContent);
      
      return backup;
    } catch (error) {
      console.error('File restoration failed:', error);
      throw error;
    }
  }

  // Restore backup from user-selected file
  async restoreBackupFromExternalFile() {
    try {
      // Pick a backup file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        throw new Error('File selection cancelled');
      }

      const file = result.assets[0];
      
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      const backup = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backup.data || !backup.data.transactions || !backup.data.accounts) {
        throw new Error('Invalid backup file format');
      }

      // Restore data to AsyncStorage
      await AsyncStorage.setItem('cashalyst_transactions', JSON.stringify(backup.data.transactions));
      await AsyncStorage.setItem('cashalyst_accounts', JSON.stringify(backup.data.accounts));
      if (backup.data.username !== undefined) {
        await AsyncStorage.setItem('username', backup.data.username);
      }
      
      // Update the main backup reference
      await AsyncStorage.setItem(this.backupKey, fileContent);
      
      return {
        success: true,
        message: 'Backup restored successfully',
        backup: backup
      };
    } catch (error) {
      console.error('Failed to restore backup from external file:', error);
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  // Check if backup exists
  async hasBackup() {
    try {
      const backup = await AsyncStorage.getItem(this.backupKey);
      return backup !== null;
    } catch (error) {
      return false;
    }
  }

  // Get backup info
  async getBackupInfo() {
    try {
      const backupString = await AsyncStorage.getItem(this.backupKey);
      if (!backupString) {
        return null;
      }

      const backup = JSON.parse(backupString);
      return {
        timestamp: backup.timestamp,
        version: backup.version,
        transactionCount: backup.data.transactions.length,
        accountCount: backup.data.accounts.length
      };
    } catch (error) {
      return null;
    }
  }

  // Export data as JSON string and share
  async exportData() {
    try {
      const transactions = await AsyncStorage.getItem('cashalyst_transactions');
      const accounts = await AsyncStorage.getItem('cashalyst_accounts');
      const username = await AsyncStorage.getItem('username');
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          transactions: transactions ? JSON.parse(transactions) : [],
          accounts: accounts ? JSON.parse(accounts) : [],
          username: username || ''
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Save to file and share
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cashalyst_export_${timestamp}.json`;
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(filePath, jsonString);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Share Cashalyst Export'
        });
      }
      
      return jsonString;
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  // Get list of backup files
  async getBackupFiles() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.backupDir);
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const fileInfos = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = `${this.backupDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          return {
            name: file,
            path: filePath,
            size: fileInfo.size,
            modificationTime: fileInfo.modificationTime
          };
        })
      );

      return fileInfos.sort((a, b) => b.modificationTime - a.modificationTime);
    } catch (error) {
      console.error('Failed to get backup files:', error);
      return [];
    }
  }

  // Clear all data (but keep backup)
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        'cashalyst_transactions',
        'cashalyst_accounts'
        // Note: NOT removing this.backupKey to preserve backup
      ]);
    } catch (error) {
      console.error('Clear data failed:', error);
      throw new Error('Failed to clear data');
    }
  }

  // Clear everything including backup (use with caution)
  async clearEverything() {
    try {
      await AsyncStorage.multiRemove([
        'cashalyst_transactions',
        'cashalyst_accounts',
        this.backupKey
      ]);
      
      // Also clear backup files
      try {
        const dirInfo = await FileSystem.getInfoAsync(this.backupDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(this.backupDir, { idempotent: true });
        }
      } catch (fileError) {
        console.error('Failed to clear backup files:', fileError);
      }
    } catch (error) {
      console.error('Clear everything failed:', error);
      throw new Error('Failed to clear everything');
    }
  }

  // Get backup location info
  async getBackupLocation() {
    try {
      return {
        directory: this.backupDir,
        readablePath: this.backupDir.replace(FileSystem.documentDirectory, 'App Documents/'),
        exists: (await FileSystem.getInfoAsync(this.backupDir)).exists
      };
    } catch (error) {
      return {
        directory: this.backupDir,
        readablePath: 'App Documents/backups/',
        exists: false
      };
    }
  }

  // Get detailed backup info with location
  async getDetailedBackupInfo() {
    try {
      const basicInfo = await this.getBackupInfo();
      const locationInfo = await this.getBackupLocation();
      const backupFiles = await this.getBackupFiles();
      
      return {
        ...basicInfo,
        location: locationInfo,
        fileCount: backupFiles.length,
        totalSize: backupFiles.reduce((sum, file) => sum + (file.size || 0), 0),
        files: backupFiles
      };
    } catch (error) {
      return null;
    }
  }

  // Create backup and save to local storage (saves to file system)
  async createBackupAndSave() {
    try {
      const backup = await this.createBackup();
      // Ensure backup directory exists before writing
      await FileSystem.makeDirectoryAsync(this.backupDir, { intermediates: true });
      const filePath = await this.saveBackupToFile(backup);
      const filename = filePath.split('/').pop();
      return { backup, filePath, filename };
    } catch (error) {
      console.error('Failed to create and save backup:', error);
      throw new Error('Failed to create and save backup: ' + error.message);
    }
  }

  // Share a specific backup file
  async shareBackupFile(filename) {
    try {
      const filePath = `${this.backupDir}${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        throw new Error('Backup file not found');
      }

      // Check if sharing is available before sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Save Cashalyst Backup',
          UTI: 'public.json'
        });
        return true;
      } else {
        throw new Error('Sharing not available on this device. Try using a development build instead of Expo Go.');
      }
    } catch (error) {
      console.error('Failed to share backup file:', error);
      if (error.message.includes('Sharing not available')) {
        throw new Error('Sharing not available in Expo Go. Use a development build for full functionality.');
      }
      throw error;
    }
  }

  // Delete specific backup file
  async deleteBackupFile(filename) {
    try {
      const filePath = `${this.backupDir}${filename}`;
      await FileSystem.deleteAsync(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete backup file:', error);
      throw error;
    }
  }

  // Get backup storage info
  async getBackupStorageInfo() {
    try {
      const backupFiles = await this.getBackupFiles();
      const totalSize = backupFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      
      return {
        fileCount: backupFiles.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        oldestBackup: backupFiles.length > 0 ? Math.min(...backupFiles.map(f => f.modificationTime)) : null,
        newestBackup: backupFiles.length > 0 ? Math.max(...backupFiles.map(f => f.modificationTime)) : null
      };
    } catch (error) {
      return {
        fileCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        oldestBackup: null,
        newestBackup: null
      };
    }
  }

  // Check if external storage is available
  async checkExternalStorageAvailability() {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      return {
        available: isSharingAvailable,
        canShare: isSharingAvailable
      };
    } catch (error) {
      return {
        available: false,
        canShare: false
      };
    }
  }
}

export default new BackupService();