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

-- Verification query
SELECT 'Customer support tables created successfully!' as status;