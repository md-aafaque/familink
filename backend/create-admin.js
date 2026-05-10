import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getSession } from './src/db.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const email = 'krishagarwal1673@gmail.com';
  const password = '123456';

  console.log('Creating admin user...');

  try {
    // 1. Create user in Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: { name: 'Admin' },
    });

    if (error || !data.user) {
      console.error('Error creating user in Supabase:', error?.message);
      return;
    }

    console.log('✅ User created in Supabase:', data.user.id);

    // 2. Create Neo4j node with admin role and approved status
    const session = getSession();
    try {
      await session.run(
        `
        CREATE (u:User {
          id: $id,
          email: $email,
          name: 'Admin',
          role: 'admin',
          status: 'approved',
          createdAt: timestamp()
        })
        `,
        { id: data.user.id, email }
      );

      console.log('✅ Neo4j node created');
      console.log('\n✅ Admin user created successfully!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('\nYou can now login at: http://localhost:3000/admin/login');

    } finally {
      await session.close();
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

createAdminUser();
