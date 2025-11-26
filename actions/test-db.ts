"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Test Database Connection
 * Verifies that the Supabase connection is working correctly
 */
export async function testDatabaseConnection() {
    try {
        const supabase = await createClient();

        // Execute a simple SELECT query on the tasks table
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .limit(10);

        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return {
                success: false,
                error: error.message,
                message: 'Failed to connect to database'
            };
        }

        console.log('✅ Database connection successful!');
        console.log(`📊 Retrieved ${data?.length || 0} tasks from the database`);

        return {
            success: true,
            rowCount: data?.length || 0,
            message: 'Database connection verified successfully'
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Unexpected error:', errorMessage);

        return {
            success: false,
            error: errorMessage,
            message: 'Unexpected error occurred during connection test'
        };
    }
}
