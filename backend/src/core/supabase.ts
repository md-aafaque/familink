import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const url = config.SUPABASE_URL;
const key = config.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
}

export const supabaseAdmin = createClient(url, key);

export const getSignedUploadUrl = async (treeId: string, fileName: string) => {
  const path = `${treeId}/${Date.now()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage
    .from('memories')
    .createSignedUploadUrl(path);

  if (error) throw error;
  return data;
};

export const getSignedDownloadUrl = async (path: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from('memories')
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
};

export const getPublicUrl = (path: string) => {
  const { data } = supabaseAdmin.storage.from('memories').getPublicUrl(path);
  return data.publicUrl;
};

export const getUserSignedUploadUrl = async (userId: string, fileName: string) => {
  const path = `avatars/${userId}/${Date.now()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage
    .from('memories')
    .createSignedUploadUrl(path);

  if (error) throw error;
  return data;
};
