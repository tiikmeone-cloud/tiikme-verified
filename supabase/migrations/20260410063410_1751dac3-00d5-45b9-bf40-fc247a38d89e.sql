
-- Add skills array to profiles for the Skills section
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Add item_type to work_items to distinguish experience/education/project
ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'project';
