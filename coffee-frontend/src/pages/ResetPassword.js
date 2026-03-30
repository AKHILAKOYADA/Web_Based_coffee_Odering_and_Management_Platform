import { useState } from "react";
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
import { Lock, Visibility, VisibilityOff, Key } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BackgroundDecor from "../components/BackgroundDecor";

function ResetPassword() {
    const navigate = useNavigate();
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (passwords.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const email = localStorage.getItem("userEmail");
            const response = await fetch("http://localhost:5005/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPassword: passwords.newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } else {
                setError(data.message || "Reset failed");
            }
        } catch (error) {
            setError("Server connection error");
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <BackgroundDecor />
                <div className="auth-bg-circle circle-1"></div>
                <div className="auth-bg-circle circle-2"></div>
                <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                    <Paper
                        elevation={0}
                        className="glass-card fade-in"
                        sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: '#4CAF50' }}>
                                <Key sx={{ color: 'white', fontSize: 32 }} />
                            </Box>
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            Password Updated!
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Redirecting you to complete your profile...
                        </Typography>
                    </Paper>
                </Container>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <BackgroundDecor />
            <div className="auth-bg-circle circle-1"></div>
            <div className="auth-bg-circle circle-2"></div>

            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={0}
                    className="glass-card fade-in"
                    sx={{ p: 5, borderRadius: 3 }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                            width: 60, height: 60, borderRadius: '50%',
                            bgcolor: 'var(--color-primary)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            mb: 2
                        }}>
                            <Lock sx={{ color: 'white', fontSize: 30 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            Reset Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                            Please set a new password for your first login.
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="New Password"
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwords.newPassword}
                            onChange={handleChange}
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Key color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            margin="normal"
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Key color="action" />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 3,
                                py: 1.5,
                                bgcolor: 'var(--color-primary)',
                                '&:hover': { bgcolor: '#2C1E19' }
                            }}
                        >
                            Set Password & Continue
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </div>
    );
}

export default ResetPassword;
