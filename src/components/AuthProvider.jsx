'use client';
export default function AuthProvider({ children }) {
  const { isAuthenticated, _hydrated } = useAuthStore();
  const { setWallet } = useWalletStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !_hydrated) return;

    const token = Cookies.get('token');

    // No token -> don't call protected APIs
    if (!token) {
      return;
    }

    // Only fetch wallet if authenticated
    if (isAuthenticated) {
      api
        .get('/api/wallet')
        .then((res) => {
          setWallet(res.data.data);
        })
        .catch((err) => {
          console.log('Wallet fetch failed:', err?.response?.data);
        });
    }
  }, [mounted, _hydrated, isAuthenticated, setWallet]);

  // Wait until client hydration finishes
  if (!mounted || !_hydrated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '2px solid #7c3aed',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />

        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return children;
}