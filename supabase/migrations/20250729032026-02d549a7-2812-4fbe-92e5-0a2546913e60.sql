-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create scans table
CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error', 'paused')),
  selected_modules TEXT[] NOT NULL DEFAULT '{}',
  module_options JSONB DEFAULT '{}',
  execution_order TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_modules INTEGER DEFAULT 0,
  completed_modules INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create policies for scans
CREATE POLICY "Users can view their own scans" 
ON public.scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" 
ON public.scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" 
ON public.scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans" 
ON public.scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create scan_results table
CREATE TABLE public.scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error', 'skipped')),
  data JSONB DEFAULT '{}',
  error_message TEXT,
  depends_on TEXT[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for scan_results
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- Create policies for scan_results (access through scan ownership)
CREATE POLICY "Users can view scan results for their scans" 
ON public.scan_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.scans 
    WHERE scans.id = scan_results.scan_id 
    AND scans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create scan results for their scans" 
ON public.scan_results 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scans 
    WHERE scans.id = scan_results.scan_id 
    AND scans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update scan results for their scans" 
ON public.scan_results 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.scans 
    WHERE scans.id = scan_results.scan_id 
    AND scans.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();