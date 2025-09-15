# Customer Support Tables Setup Guide

## Issue
The customer support system is throwing 500 errors because the required database tables (`support_chat` and `chat_message`) don't exist in your Supabase database.

## Solution
You need to create these tables in your Supabase database. Here are the steps:

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor** (table icon in the sidebar)
4. Create a new query and paste the following SQL:

```sql
-- Create customer support tables for ticket system

-- Create support_chat table
CREATE TABLE IF NOT EXISTS public.support_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    assigned_to UUID REFERENCES public.profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_message table
CREATE TABLE IF NOT EXISTS public.chat_message (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.support_chat(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_chat_user_id ON public.support_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_status ON public.support_chat(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_priority ON public.support_chat(priority);
CREATE INDEX IF NOT EXISTS idx_support_chat_assigned_to ON public.support_chat(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_chat_created_at ON public.support_chat(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_message_chat_id ON public.chat_message(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_sender_id ON public.chat_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_created_at ON public.chat_message(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_support_chat_updated_at ON public.support_chat;
CREATE TRIGGER update_support_chat_updated_at
    BEFORE UPDATE ON public.support_chat
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_message_updated_at ON public.chat_message;
CREATE TRIGGER update_chat_message_updated_at
    BEFORE UPDATE ON public.chat_message
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments for documentation
COMMENT ON TABLE public.support_chat IS 'Customer support chat/ticket system';
COMMENT ON COLUMN public.support_chat.subject IS 'Subject/title of the support ticket';
COMMENT ON COLUMN public.support_chat.priority IS 'Priority level of the support ticket';
COMMENT ON COLUMN public.support_chat.status IS 'Current status of the support ticket';
COMMENT ON COLUMN public.support_chat.assigned_to IS 'Admin user assigned to handle this ticket';

COMMENT ON TABLE public.chat_message IS 'Messages within support chats/tickets';
COMMENT ON COLUMN public.chat_message.is_admin IS 'Whether the message was sent by an admin user';
```

5. Click **RUN** to execute the SQL

### Method 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd /Users/kurohiko/JJ-Essencial

# Run the migration
supabase db push --local-only migrations/create_customer_support_tables.sql
```

### Method 3: Enable RLS (Row Level Security)

After creating the tables, you should also set up Row Level Security:

```sql
-- Enable RLS on both tables
ALTER TABLE public.support_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;

-- Policy for support_chat: Users can only see their own chats
CREATE POLICY "Users can view own support chats" ON public.support_chat
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own support chats" ON public.support_chat
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for chat_message: Users can only see messages in their chats
CREATE POLICY "Users can view messages in own chats" ON public.chat_message
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_chat 
            WHERE id = chat_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own chats" ON public.chat_message
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_chat 
            WHERE id = chat_id AND user_id = auth.uid()
        )
    );

-- Admin policies (replace 'ADMIN' with your actual admin role column)
CREATE POLICY "Admins can view all support chats" ON public.support_chat
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profile 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can view all chat messages" ON public.chat_message
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profile 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );
```

## Verification

After creating the tables, you can verify they exist by running this SQL query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('support_chat', 'chat_message');
```

You should see both tables listed.

## Next Steps

1. Create the tables using Method 1 above
2. Test the customer support endpoints in your frontend
3. The 500 errors should be resolved

## Notes

- The backend code has been updated to handle missing tables gracefully
- Users will see a helpful error message if tables don't exist
- The table structure follows your existing database naming conventions (snake_case)
- All foreign key relationships are properly set up
- Indexes are created for optimal performance