import EmailLogModel from '../models/EmailLog';
import EmailPreferencesModel from '../models/EmailPreferences';
import UserModel from '../models/User';

async function createEmailTables() {
  try {
    console.log('Creating email-related database tables...');
    
    // Create email logs table
    await EmailLogModel.createTable();
    console.log('✅ Email logs table created successfully');
    
    // Create email preferences table
    await EmailPreferencesModel.createTable();
    console.log('✅ Email preferences table created successfully');
    
    // Initialize default email preferences for existing users
    console.log('Initializing default email preferences for existing users...');
    const users = await UserModel.getAll();
    
    for (const user of users) {
      try {
        await EmailPreferencesModel.create({
          user_id: user.id,
          task_assignments: true,
          task_overdue: true,
          task_escalations: true,
          opportunity_updates: true,
          opportunity_won: true,
          daily_digest: user.role === 'bu_head' || user.role === 'senior_management',
          weekly_digest: user.role === 'senior_management',
          email_frequency: 'immediate',
          digest_time: '08:00'
        });
        console.log(`✅ Default preferences set for user ${user.username}`);
      } catch (error) {
        // User preferences might already exist
        console.log(`⚠️  User ${user.username} preferences already exist or error occurred`);
      }
    }
    
    console.log('🎉 Email system database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up email system database:', error);
    process.exit(1);
  }
}

createEmailTables();
