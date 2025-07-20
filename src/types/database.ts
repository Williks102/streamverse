export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: 'live' | 'vod' | 'offline';
          category: string | null;
          thumbnail_url: string | null;
          is_published: boolean;
          status: string | null;
          start_time: string | null;
          duration: string | null;
          video_src: string | null;
          location: string | null;
          address: string | null;
          promoter_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: 'live' | 'vod' | 'offline';
          category?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          status?: string | null;
          start_time?: string | null;
          duration?: string | null;
          video_src?: string | null;
          location?: string | null;
          address?: string | null;
          promoter_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?: 'live' | 'vod' | 'offline';
          category?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          status?: string | null;
          start_time?: string | null;
          duration?: string | null;
          video_src?: string | null;
          location?: string | null;
          address?: string | null;
          promoter_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          role: 'user' | 'promoter' | 'admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          role?: 'user' | 'promoter' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          role?: 'user' | 'promoter' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          price?: number;
          created_at?: string;
        };
      };
    };
  };
};