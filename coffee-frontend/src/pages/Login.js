import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Paper,
    InputAdornment,
    IconButton,
    Alert
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock, LocalCafe, ArrowBack } from "@mui/icons-material";
import BackgroundDecor from "../components/BackgroundDecor";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch("http://localhost:5005/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userEmail", email);
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }

                const userRole = data.user?.role || data.role;
                const mustReset = data.user?.mustResetPassword || data.mustResetPassword;

                localStorage.setItem("role", userRole);

                if (mustReset) {
                    navigate("/reset-password");
                } else if (userRole === "admin") {
                    navigate("/admin-dashboard");
                } else if (userRole === "cafe_owner") {
                    navigate("/cafe-owner-dashboard");
                } else if (userRole === "chef") {
                    navigate("/chef-dashboard");
                } else if (userRole === "waiter") {
                    navigate("/waiter-dashboard");
                } else {
                    navigate("/dashboard");
                }
            } else {
                setError(data.message || "Login failed");
            }
        } catch (error) {
            setError("Server connection error");
        }
    };

    return (
        <div className="auth-container">
            <BackgroundDecor />
            <div className="drift-bg"></div>
            {/* Background Decorations */}
            <div className="auth-bg-circle circle-1"></div>
            <div className="auth-bg-circle circle-2"></div>

            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                <IconButton
                    onClick={() => navigate('/')}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: 'var(--color-primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': { bgcolor: 'white' },
                        zIndex: 10
                    }}
                    aria-label="Back to Home"
                >
                    <ArrowBack />
                </IconButton>
                <Paper
                    elevation={0}
                    className="glass-card fade-in"
                    sx={{
                        p: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 3
                    }}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: 'var(--color-primary)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mb: 2,
                            boxShadow: '0 4px 12px rgba(60, 42, 33, 0.3)'
                        }}
                    >
                        <LocalCafe sx={{ color: 'white', fontSize: 32 }} />
                    </Box>

                    <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: 'var(--color-primary)', mb: 1 }}>
                        Welcome Back
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Sign in to continue your coffee journey
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email color="action" />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                            }}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 1,
                                mb: 3,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderRadius: 2,
                                bgcolor: 'var(--color-primary)',
                                textTransform: 'none',
                                '&:hover': {
                                    bgcolor: '#2C1E19',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 6px 12px rgba(60, 42, 33, 0.2)'
                                },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Sign In
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                New here?{' '}
                                <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                                    Create an account
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </div>
    );
}

export default Login;
