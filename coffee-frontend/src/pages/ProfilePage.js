import React, { useState, useEffect } from "react";
import {
    Container, Box, Typography, TextField, Button, Avatar,
    Grid, Divider, Chip, Alert, CircularProgress, Paper,
    IconButton, Tooltip
} from "@mui/material";
import {
    Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon,
    ArrowBack as ArrowBackIcon, Person as PersonIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5005/api";

const ROLE_STYLES = {
    admin: { color: "#FFFFFF", bg: "#3C2A21", label: "Administrator" },
    cafe_owner: { color: "#3C2A21", bg: "#E6CCB2", label: "Café Owner" },
    customer: { color: "#7F5539", bg: "#EDE0D4", label: "Customer" },
    chef: { color: "#FFFFFF", bg: "#7F5539", label: "Chef" },
    waiter: { color: "#3C2A21", bg: "#D4A373", label: "Waiter" },
};

function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) { navigate("/login"); return; }
        fetchProfile();
        // eslint-disable-next-line
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load profile");
            const data = await res.json();
            setProfile(data);
            setForm({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                dob: data.dob || "",
                gender: data.gender || "",
                plotNo: data.plotNo || "",
                street: data.street || "",
                landmark: data.landmark || "",
                city: data.city || "",
                pincode: data.pincode || "",
            });
        } catch (err) {
            setAlert({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        setAlert(null);
        try {
            const res = await fetch(`${API_BASE}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Update failed");
            setAlert({ type: "success", message: "Profile updated successfully!" });
            setProfile((prev) => ({ ...prev, ...form }));
            setEditMode(false);
        } catch (err) {
            setAlert({ type: "error", message: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            dob: profile.dob || "",
            gender: profile.gender || "",
            plotNo: profile.plotNo || "",
            street: profile.street || "",
            landmark: profile.landmark || "",
            city: profile.city || "",
            pincode: profile.pincode || "",
        });
        setEditMode(false);
        setAlert(null);
    };

    const getBackPath = () => {
        if (profile?.role === "admin") return "/admin-dashboard";
        if (profile?.role === "cafe_owner") return "/cafe-owner-dashboard";
        return "/dashboard";
    };

    const roleStyle = profile ? (ROLE_STYLES[profile.role] || { color: "#fff", bg: "#3C2A21", label: profile.role }) : {};

    return (
        <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 4, px: 2 }}>
            <Container maxWidth="md">

                {/* Back Button */}
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(getBackPath())}
                    sx={{
                        color: "var(--color-primary)",
                        mb: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "rgba(60,42,33,0.06)" },
                    }}
                >
                    Back to Dashboard
                </Button>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: "hidden",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                        bgcolor: "#fff",
                    }}
                >
                    {/* ── Header Banner ── */}
                    <Box
                        sx={{
                            bgcolor: "var(--color-primary)",
                            p: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 72,
                                height: 72,
                                bgcolor: roleStyle.bg || "#d4a373",
                                color: roleStyle.color || "#3c2a21",
                                fontSize: "1.8rem",
                                fontWeight: 800,
                                fontFamily: "'Playfair Display', serif",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                        >
                            {profile
                                ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase()
                                : <PersonIcon fontSize="large" />}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontFamily: "'Playfair Display', serif",
                                }}
                            >
                                {profile ? `${profile.firstName} ${profile.lastName}` : "Loading…"}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", mt: 0.3 }}>
                                {profile?.email}
                            </Typography>
                            {profile && (
                                <Chip
                                    label={roleStyle.label}
                                    size="small"
                                    sx={{
                                        mt: 1,
                                        bgcolor: roleStyle.bg,
                                        color: roleStyle.color,
                                        fontWeight: 700,
                                        fontSize: "0.7rem",
                                    }}
                                />
                            )}
                        </Box>

                        {!editMode && !loading && (
                            <Tooltip title="Edit Profile">
                                <IconButton
                                    onClick={() => setEditMode(true)}
                                    sx={{
                                        bgcolor: "rgba(255,255,255,0.12)",
                                        color: "#fff",
                                        border: "1px solid rgba(255,255,255,0.25)",
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* ── Body ── */}
                    <Box sx={{ p: 4, bgcolor: "#fcfaf7" }}>
                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                                <CircularProgress sx={{ color: "var(--color-primary)" }} />
                            </Box>
                        ) : (
                            <>
                                {alert && (
                                    <Alert
                                        severity={alert.type}
                                        onClose={() => setAlert(null)}
                                        sx={{ mb: 3, borderRadius: 2 }}
                                    >
                                        {alert.message}
                                    </Alert>
                                )}

                                {/* Personal Info */}
                                <SectionHeader title="Personal Information" />

                                <Grid container spacing={3} sx={{ mb: 4 }}>
                                    <Grid item xs={12} sm={6}>
                                        <ProfileField label="First Name" name="firstName" value={form.firstName} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <ProfileField label="Last Name" name="lastName" value={form.lastName} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <ProfileField label="Date of Birth" name="dob" value={form.dob} editMode={editMode} onChange={handleChange} type="date" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <ProfileField label="Gender" name="gender" value={form.gender} editMode={editMode} onChange={handleChange} select options={["Male", "Female", "Other", "Prefer not to say"]} />
                                    </Grid>
                                </Grid>

                                {/* Address */}
                                <SectionHeader title="Address" />

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={4}>
                                        <ProfileField label="Plot / House No." name="plotNo" value={form.plotNo} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={8}>
                                        <ProfileField label="Street" name="street" value={form.street} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <ProfileField label="Landmark" name="landmark" value={form.landmark} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <ProfileField label="City" name="city" value={form.city} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                        <ProfileField label="Pincode" name="pincode" value={form.pincode} editMode={editMode} onChange={handleChange} />
                                    </Grid>
                                </Grid>

                                {/* Action Buttons */}
                                {editMode && (
                                    <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancel}
                                            sx={{
                                                color: "var(--color-primary)",
                                                borderColor: "rgba(60,42,33,0.3)",
                                                textTransform: "none",
                                                borderRadius: 2,
                                                "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(60,42,33,0.04)" },
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                            onClick={handleSave}
                                            disabled={saving}
                                            sx={{
                                                bgcolor: "var(--color-primary)",
                                                color: "#fff",
                                                fontWeight: 700,
                                                textTransform: "none",
                                                borderRadius: 2,
                                                px: 3,
                                                "&:hover": { bgcolor: "#2C1E19" },
                                            }}
                                        >
                                            {saving ? "Saving…" : "Save Changes"}
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }) {
    return (
        <>
            <Typography
                variant="overline"
                sx={{
                    color: "var(--color-primary)",
                    fontWeight: 700,
                    letterSpacing: 2,
                    fontSize: "0.7rem",
                }}
            >
                {title}
            </Typography>
            <Divider sx={{ borderColor: "rgba(60,42,33,0.12)", mb: 2.5, mt: 0.5 }} />
        </>
    );
}

// ── Single field (read-only or editable) ─────────────────────────────────────
function ProfileField({ label, name, value, editMode, onChange, type = "text", select, options }) {
    if (!editMode) {
        return (
            <Box>
                <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}
                >
                    {label}
                </Typography>
                <Typography sx={{ color: "var(--color-primary)", mt: 0.3, fontWeight: 600 }}>
                    {value || "—"}
                </Typography>
            </Box>
        );
    }

    if (select) {
        return (
            <TextField
                select
                fullWidth
                label={label}
                name={name}
                value={value}
                onChange={onChange}
                SelectProps={{ native: true }}
                variant="outlined"
                size="small"
                sx={fieldSx}
            >
                <option value=""></option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </TextField>
        );
    }

    return (
        <TextField
            fullWidth
            label={label}
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            variant="outlined"
            size="small"
            InputLabelProps={type === "date" ? { shrink: true } : undefined}
            sx={fieldSx}
        />
    );
}

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        bgcolor: "#fff",
        "& fieldset": { borderColor: "rgba(60,42,33,0.2)" },
        "&:hover fieldset": { borderColor: "var(--color-secondary)" },
        "&.Mui-focused fieldset": { borderColor: "var(--color-primary)" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "var(--color-primary)" },
};

export default ProfilePage;
