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
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepButton,
    Grid,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Divider,
    Snackbar
} from "@mui/material";
import {
    Email,
    Person,
    LocalCafe,
    ChevronRight,
    ChevronLeft,
    Home,
    School,
    Work,
    AddCircle,
    Delete,
    CalendarMonth,
    Wc,
    CheckCircle,
    ContentCopy,
    Business,
    AccessTime
} from "@mui/icons-material";
import BackgroundDecor from "../components/BackgroundDecor";

function Register() {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tempPass, setTempPass] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [roleChosen, setRoleChosen] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Form State
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        dob: "",
        gender: "",
        street: "",
        plotNo: "",
        landmark: "",
        city: "",
        pincode: "",
        role: "customer" // Default role
    });

    const [govtFile, setGovtFile] = useState(null);
    const [academicInfo, setAcademicInfo] = useState([{ degree: "", institution: "", year: "" }]);
    const [workExperience, setWorkExperience] = useState([{ role: "", company: "", duration: "" }]);

    const handleRoleSelect = (role) => {
        setProfile({ ...profile, role: role });
        setRoleChosen(true);
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setGovtFile(file);
        } else {
            alert("Please upload a valid PDF file.");
            e.target.value = null;
        }
    };

    // Dynamic Field Handlers
    const handleAcademicChange = (index, e) => {
        const newAcademic = [...academicInfo];
        newAcademic[index][e.target.name] = e.target.value;
        setAcademicInfo(newAcademic);
    };

    const addAcademicRow = () => setAcademicInfo([...academicInfo, { degree: "", institution: "", year: "" }]);
    const removeAcademicRow = (index) => {
        if (academicInfo.length > 1) {
            const newAcademic = [...academicInfo];
            newAcademic.splice(index, 1);
            setAcademicInfo(newAcademic);
        }
    };

    const handleWorkChange = (index, e) => {
        const newWork = [...workExperience];
        newWork[index][e.target.name] = e.target.value;
        setWorkExperience(newWork);
    };

    const addWorkRow = () => setWorkExperience([...workExperience, { role: "", company: "", duration: "" }]);
    const removeWorkRow = (index) => {
        const newWork = [...workExperience];
        newWork.splice(index, 1);
        setWorkExperience(newWork);
    };

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleStepClick = (step) => {
        if (step < activeStep) {
            setActiveStep(step);
        } else if (step === 1 && isStep1Complete) {
            setActiveStep(1);
        } else if (step === 2 && isStep1Complete && isStep2Complete) {
            setActiveStep(2);
        } else if (step === 3 && isStep1Complete && isStep2Complete && isStep3Complete) {
            setActiveStep(3);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("profile", JSON.stringify(profile));
            formData.append("academicInfo", JSON.stringify(academicInfo));
            formData.append("workExperience", JSON.stringify(workExperience));
            if (govtFile) {
                formData.append("govtProofFile", govtFile);
            }

            const response = await fetch("http://localhost:5005/api/register", {
                method: "POST",
                body: formData
            });

            let data = {};
            const text = await response.text();
            try { data = JSON.parse(text); } catch (_) { data = { message: text }; }

            if (response.ok && data.success) {
                setLoading(false);
                setSuccess(true);
            } else {
                const errMsg = data.message || data.error || `Server error (${response.status}): Registration failed.`;
                setError(errMsg);
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Could not connect to the server. Make sure the backend is running on port 5005.");
            setLoading(false);
        }
    };

    const steps = ["Personal Info", "Address", "Education & Work", "Verification"];

    const isStep1Complete = profile.firstName && profile.lastName && profile.email && profile.dob && profile.gender;
    const isStep2Complete = profile.street && profile.plotNo && profile.landmark && profile.city && profile.pincode;
    const isStep3Complete = academicInfo.every(info => info.degree && info.institution && info.year);
    const isStep4Complete = govtFile;

    if (success) {
        // ... (Keep existing success return)
        return (
            <div className="auth-container">
                <BackgroundDecor />
                <div className="drift-bg"></div>
                <div className="auth-bg-circle circle-1"></div>
                <div className="auth-bg-circle circle-2"></div>
                <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                    <Paper
                        elevation={0}
                        className="glass-card animate-scale-in"
                        sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 4 }}
                    >
                        <Box sx={{ mb: 3 }}>
                            <AccessTime sx={{ color: '#ff9800', fontSize: 80 }} />
                        </Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                            Registration Submitted!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
                            Thank you for joining Coffee House.
                            <br />
                            Your application as a <strong>{profile.role.replace('_', ' ')}</strong> is now <strong>Pending Admin Approval</strong>.
                        </Typography>
                        <Alert severity="warning" sx={{ mb: 4, textAlign: 'left', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                What's next?
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, m: 0, mt: 1 }}>
                                <li>The administrator will review your profile and government proof.</li>
                                <li>Once approved, your temporary credentials will be sent to <strong>{profile.email}</strong>.</li>
                                <li>You will be required to reset your password upon your first login.</li>
                            </Box>
                        </Alert>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate('/')}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                color: 'var(--color-primary)',
                                borderColor: 'var(--color-primary)',
                                borderRadius: 2,
                                '&:hover': { border: '1px solid var(--color-primary)', border: '1px solid var(--color-primary)', bgcolor: 'rgba(60, 42, 33, 0.05)' }
                            }}
                        >
                            Back to Home
                        </Button>
                    </Paper>
                </Container>
            </div>
        );
    }

    if (!roleChosen) {
        return (
            <div className="auth-container">
                <BackgroundDecor />
                <div className="drift-bg"></div>
                <div className="auth-bg-circle circle-1"></div>
                <div className="auth-bg-circle circle-2"></div>

                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center', mb: 6 }} className="animate-slide-up">
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 2 }}>
                            Choose Your Journey
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            How would you like to explore Coffee House?
                        </Typography>
                    </Box>

                    <Grid container spacing={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Grid item xs={12} sm={5}>
                            <Paper
                                className="glass-card animate-scale-in"
                                onClick={() => handleRoleSelect('customer')}
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', bgcolor: 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                                    <Box sx={{ bgcolor: '#7F5539', p: 3, borderRadius: '50%', display: 'flex' }}>
                                        <LocalCafe sx={{ fontSize: 40, color: 'white' }} />
                                    </Box>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'var(--color-primary)' }}>Customer</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Book tables, order food, and track your caffeine journey.
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <Paper
                                className="glass-card animate-scale-in delay-200"
                                onClick={() => handleRoleSelect('cafe_owner')}
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', bgcolor: 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                                    <Box sx={{ bgcolor: 'var(--color-primary)', p: 3, borderRadius: '50%', display: 'flex' }}>
                                        <Business sx={{ fontSize: 40, color: 'white' }} />
                                    </Box>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'var(--color-primary)' }}>Café Owner</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage your café, tables, and staff in one place.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 6, textAlign: 'center' }} className="animate-fade-in delay-400">
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Container>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <BackgroundDecor />
            <div className="drift-bg"></div>
            <div className="auth-bg-circle circle-1"></div>
            <div className="auth-bg-circle circle-2"></div>

            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                <IconButton
                    onClick={() => setRoleChosen(false)}
                    sx={{ position: 'absolute', top: 20, left: 20, color: 'white', bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' } }}
                >
                    <ChevronLeft />
                </IconButton>

                <Paper
                    elevation={0}
                    className="glass-card animate-fade-in"
                    sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, overflow: 'hidden' }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 50, height: 50, borderRadius: '50%',
                                bgcolor: 'var(--color-primary)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                mb: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                            }}
                        >
                            <LocalCafe sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                            Join as {profile.role === 'cafe_owner' ? 'Café Owner' : 'Customer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Complete your registration to start your journey
                        </Typography>
                    </Box>

                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                        {steps.map((label, index) => (
                            <Step key={label} completed={index === 0 ? isStep1Complete : index === 1 ? isStep2Complete : index === 2 ? isStep3Complete : isStep4Complete}>
                                <StepButton
                                    color="inherit"
                                    onClick={() => handleStepClick(index)}
                                    sx={{
                                        '& .MuiStepLabel-label': {
                                            fontFamily: "'Playfair Display', serif",
                                            fontWeight: activeStep === index ? 700 : 400
                                        }
                                    }}
                                >
                                    <StepLabel
                                        StepIconProps={{
                                            sx: {
                                                '&.Mui-active': { color: 'var(--color-secondary)' },
                                                '&.Mui-completed': { color: 'var(--color-primary)' }
                                            }
                                        }}
                                    >
                                        {label}
                                    </StepLabel>
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>

                    <Box component="form">
                        {activeStep === 0 && (
                            <Box className="animate-slide-up">
                                <Typography variant="h6" sx={{ color: 'var(--color-primary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Person fontSize="small" /> Personal Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="First Name" name="firstName" value={profile.firstName} onChange={handleChange} required variant="outlined" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Last Name" name="lastName" value={profile.lastName} onChange={handleChange} required variant="outlined" />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth label="Email Address" name="email" type="email" value={profile.email} onChange={handleChange} required variant="outlined"
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="action" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth type="date" name="dob" label="Date of Birth" value={profile.dob} onChange={handleChange} required
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarMonth color="action" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Gender</InputLabel>
                                            <Select name="gender" label="Gender" value={profile.gender} onChange={handleChange} startAdornment={<InputAdornment position="start" sx={{ mr: 1 }}><Wc color="action" /></InputAdornment>}>
                                                <MenuItem value="male">Male</MenuItem>
                                                <MenuItem value="female">Female</MenuItem>
                                                <MenuItem value="other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {activeStep === 1 && (
                            <Box className="animate-slide-up">
                                <Typography variant="h6" sx={{ color: 'var(--color-primary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Home fontSize="small" /> Address Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Plot / Flat No" name="plotNo" value={profile.plotNo} onChange={handleChange} required />
                                    </Grid>
                                    <Grid item xs={12} sm={8}>
                                        <TextField fullWidth label="Street / Area" name="street" value={profile.street} onChange={handleChange} required />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Landmark" name="landmark" value={profile.landmark} onChange={handleChange} required placeholder="e.g. Near City Mall" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="City" name="city" value={profile.city} onChange={handleChange} required />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Pincode" name="pincode" value={profile.pincode} onChange={handleChange} required />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {activeStep === 2 && (
                            <Box className="animate-slide-up">
                                <Stack spacing={4}>
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <School fontSize="small" /> Academic Info
                                            </Typography>
                                            <Button startIcon={<AddCircle />} onClick={addAcademicRow} size="small" sx={{ color: 'var(--color-secondary)' }}>Add</Button>
                                        </Box>
                                        {academicInfo.map((row, index) => (
                                            <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
                                                <TextField fullWidth label="Degree" name="degree" value={row.degree} onChange={(e) => handleAcademicChange(index, e)} size="small" required />
                                                <TextField fullWidth label="Institution" name="institution" value={row.institution} onChange={(e) => handleAcademicChange(index, e)} size="small" required />
                                                <TextField label="Year" name="year" value={row.year} onChange={(e) => handleAcademicChange(index, e)} size="small" sx={{ minWidth: 100 }} required />
                                                {academicInfo.length > 1 && (
                                                    <IconButton onClick={() => removeAcademicRow(index)} color="error" size="small"><Delete /></IconButton>
                                                )}
                                            </Stack>
                                        ))}
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Work fontSize="small" /> Work Experience <Typography variant="caption" sx={{ ml: 1 }}>(Optional)</Typography>
                                            </Typography>
                                            <Button startIcon={<AddCircle />} onClick={addWorkRow} size="small" sx={{ color: 'var(--color-secondary)' }}>Add</Button>
                                        </Box>
                                        {workExperience.map((row, index) => (
                                            <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
                                                <TextField fullWidth label="Role" name="role" value={row.role} onChange={(e) => handleWorkChange(index, e)} size="small" />
                                                <TextField fullWidth label="Company" name="company" value={row.company} onChange={(e) => handleWorkChange(index, e)} size="small" />
                                                <TextField label="Duration" name="duration" value={row.duration} onChange={(e) => handleWorkChange(index, e)} size="small" sx={{ minWidth: 100 }} />
                                                <IconButton onClick={() => removeWorkRow(index)} color="error" size="small"><Delete /></IconButton>
                                            </Stack>
                                        ))}
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {activeStep === 3 && (
                            <Box className="animate-slide-up">
                                <Typography variant="h6" sx={{ color: 'var(--color-primary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            p: 3,
                                            border: '2px dashed rgba(60, 42, 33, 0.2)',
                                            borderRadius: 2,
                                            textAlign: 'center',
                                            bgcolor: 'rgba(212, 163, 115, 0.05)'
                                        }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                                Upload Government ID Proof (PDF only)
                                            </Typography>
                                            <input
                                                accept="application/pdf"
                                                style={{ display: 'none' }}
                                                id="govt-proof-file"
                                                type="file"
                                                onChange={handleFileChange}
                                            />
                                            <label htmlFor="govt-proof-file">
                                                <Button
                                                    variant="outlined"
                                                    component="span"
                                                    sx={{
                                                        mt: 1,
                                                        borderColor: 'var(--color-primary)',
                                                        color: 'var(--color-primary)',
                                                        '&:hover': { bgcolor: 'rgba(60, 42, 33, 0.05)', borderColor: 'var(--color-primary)' }
                                                    }}
                                                >
                                                    {govtFile ? 'Change File' : 'Select PDF'}
                                                </Button>
                                            </label>
                                            {govtFile && (
                                                <Typography variant="body2" sx={{ mt: 2, color: 'success.main', fontWeight: 500 }}>
                                                    Selected: {govtFile.name}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {error && (
                            <Alert
                                severity="error"
                                onClose={() => setError("")}
                                sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                startIcon={<ChevronLeft />}
                                sx={{ color: 'var(--color-primary)' }}
                            >
                                Back
                            </Button>

                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handleRegister}
                                    disabled={loading || !isStep4Complete}
                                    sx={{ bgcolor: 'var(--color-primary)', minWidth: 150, borderRadius: 2, '&:hover': { bgcolor: '#2C1E19' } }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Account"}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    disabled={
                                        (activeStep === 0 && !isStep1Complete) ||
                                        (activeStep === 1 && !isStep2Complete) ||
                                        (activeStep === 2 && !isStep3Complete)
                                    }
                                    endIcon={<ChevronRight />}
                                    sx={{ bgcolor: 'var(--color-primary)', minWidth: 120, borderRadius: 2, '&:hover': { bgcolor: '#2C1E19' } }}
                                >
                                    Next
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                                Sign in
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={() => setSnackbarOpen(false)}
                message="Password copied to clipboard!"
            />
        </div>
    );
}

export default Register;
