import { useApp } from '../context/AppContext';

const useUser = () => {
  const { user, profile, isLoading } = useApp();
  
  return { 
    user: profile || user, 
    data: profile || user, 
    loading: isLoading,
    refetch: () => {} // Firebase handles auth state automatically
  };
};

export { useUser }

export default useUser;