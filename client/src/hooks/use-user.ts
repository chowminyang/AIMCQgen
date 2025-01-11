import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type User = {
  id: number;
};

type LoginData = {
  password: string;
};

type RequestResult = {
  ok: true;
  user?: User;
  token?: string;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: LoginData
): Promise<RequestResult> {
  try {
    const auth = localStorage.getItem('auth');
    const response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { "Authorization": `Bearer ${auth}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('auth', data.token);
    }
    return { ok: true, user: data.user };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser(): Promise<User | null> {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return null;
  }

  const response = await fetch('/api/user', {
    headers: {
      "Authorization": `Bearer ${auth}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth');
      return null;
    }

    throw new Error(`${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, LoginData>({
    mutationFn: (loginData) => handleRequest('/api/login', 'POST', loginData),
    onSuccess: (data) => {
      if (data.ok && data.user) {
        queryClient.setQueryData(['user'], data.user);
      }
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      localStorage.removeItem('auth');
      queryClient.setQueryData(['user'], null);
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}