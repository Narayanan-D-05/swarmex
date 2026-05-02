// Test script to verify 0G Storage SDK migration
import { uploadMemory } from '../shared/0g-storage-client';

async function testStorageUpload() {
  console.log('Testing 0G Storage upload with new SDK...');

  try {
    const testData = {
      test: 'data',
      timestamp: Date.now(),
      message: 'Testing migration to new 0G Storage SDK'
    };

    console.log('Uploading test data...');
    const rootHash = await uploadMemory(testData);
    console.log('✅ Upload successful! Root hash:', rootHash);

    return { success: true, rootHash };
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testStorageUpload().then(result => {
  console.log('Test result:', result);
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});