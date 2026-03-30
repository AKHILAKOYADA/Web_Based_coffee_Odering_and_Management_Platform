import { useState } from "react";
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    IconButton,
    Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Person, Home, Badge, School, Work, AddCircle, Delete } from "@mui/icons-material";
import BackgroundDecor from "../components/BackgroundDecor";

function CompleteProfile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        street: "",
        plotNo: "",
        city: "",
        pincode: "",
    });

    // Separate state for dynamic arrays
    const [academicInfo, setAcademicInfo] = useState([{ degree: "", institution: "", year: "" }]);
    const [workExperience, setWorkExperience] = useState([{ role: "", company: "", duration: "" }]);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    // --- Dynamic Field Handlers ---
    const handleAcademicChange = (index, e) => {
        const newAcademic = [...academicInfo];
        newAcademic[index][e.target.name] = e.target.value;
        setAcademicInfo(newAcademic);
    };

    const addAcademicRow = () => {
        setAcademicInfo([...academicInfo, { degree: "", institution: "", year: "" }]);
    };

    const removeAcademicRow = (index) => {
        const newAcademic = [...academicInfo];
        if (newAcademic.length > 1) {
            newAcademic.splice(index, 1);
            setAcademicInfo(newAcademic);
        }
    };

    const handleWorkChange = (index, e) => {
        const newWork = [...workExperience];
        newWork[index][e.target.name] = e.target.value;
        setWorkExperience(newWork);
    };

    const addWorkRow = () => {
        setWorkExperience([...workExperience, { role: "", company: "", duration: "" }]);
    };

    const removeWorkRow = (index) => {
        const newWork = [...workExperience];
        if (newWork.length > 0) { // Can be empty
            newWork.splice(index, 1);
            setWorkExperience(newWork);
        }
    };

    const isProfileComplete = Object.values(profile).every((value) => value !== "") &&
        academicInfo.every(info => info.degree && info.institution);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isProfileComplete) {
            console.log("Submitting:", { ...profile, academicInfo, workExperience });
            navigate("/dashboard");
        }
    };

    return (
        <div className="auth-container">
            <BackgroundDecor />
            <div className="auth-bg-circle circle-1"></div>
            <div className="auth-bg-circle circle-2"></div>

            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                <Paper
                    elevation={0}
                    className="glass-card fade-in"
                    sx={{ p: 5, borderRadius: 3 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                bgcolor: 'var(--color-secondary)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mr: 2
                            }}
                        >
                            <Badge sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            Complete Your Profile
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            {/* --- Personal Info --- */}
                            <Box>
                                <Typography variant="h6" sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Person fontSize="small" /> Personal Information
                                </Typography>
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth label="First Name" name="firstName" value={profile.firstName} onChange={handleChange} variant="outlined" />
                                        <TextField fullWidth label="Last Name" name="lastName" value={profile.lastName} onChange={handleChange} variant="outlined" />
                                    </Stack>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth type="date" name="dob" value={profile.dob} InputLabelProps={{ shrink: true }} label="Date of Birth" onChange={handleChange} variant="outlined" />
                                        <FormControl fullWidth>
                                            <InputLabel>Gender</InputLabel>
                                            <Select name="gender" layout="auto" label="Gender" value={profile.gender} onChange={handleChange}>
                                                <MenuItem value="male">Male</MenuItem>
                                                <MenuItem value="female">Female</MenuItem>
                                                <MenuItem value="other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                </Stack>
                            </Box>

                            <Divider />

                            {/* --- Address Info --- */}
                            <Box>
                                <Typography variant="h6" sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Home fontSize="small" /> Address Details
                                </Typography>
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth label="Plot No / Flat No" name="plotNo" value={profile.plotNo} onChange={handleChange} variant="outlined" />
                                        <TextField fullWidth label="Street Name" name="street" value={profile.street} onChange={handleChange} variant="outlined" />
                                    </Stack>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth label="City" name="city" value={profile.city} onChange={handleChange} variant="outlined" />
                                        <TextField fullWidth label="Pincode" name="pincode" value={profile.pincode} onChange={handleChange} variant="outlined" />
                                    </Stack>
                                </Stack>
                            </Box>

                            <Divider />

                            {/* --- Academic Info (Dynamic) --- */}
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <School fontSize="small" /> Academic Information
                                    </Typography>
                                    <Button startIcon={<AddCircle />} onClick={addAcademicRow} size="small" sx={{ color: 'var(--color-secondary)' }}>
                                        Add
                                    </Button>
                                </Box>
                                <Stack spacing={2}>
                                    {academicInfo.map((row, index) => (
                                        <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                            <TextField fullWidth label="Degree / Course" name="degree" value={row.degree} onChange={(e) => handleAcademicChange(index, e)} size="small" />
                                            <TextField fullWidth label="Institution" name="institution" value={row.institution} onChange={(e) => handleAcademicChange(index, e)} size="small" />
                                            <TextField label="Year" name="year" value={row.year} onChange={(e) => handleAcademicChange(index, e)} size="small" sx={{ minWidth: 100 }} />
                                            {academicInfo.length > 1 && (
                                                <IconButton onClick={() => removeAcademicRow(index)} color="error" size="small">
                                                    <Delete />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>

                            <Divider />

                            {/* --- Work Experience (Dynamic & Optional) --- */}
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Work fontSize="small" /> Work Experience <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(Optional)</Typography>
                                    </Typography>
                                    <Button startIcon={<AddCircle />} onClick={addWorkRow} size="small" sx={{ color: 'var(--color-secondary)' }}>
                                        Add
                                    </Button>
                                </Box>
                                <Stack spacing={2}>
                                    {workExperience.map((row, index) => (
                                        <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                            <TextField fullWidth label="Job Title" name="role" value={row.role} onChange={(e) => handleWorkChange(index, e)} size="small" />
                                            <TextField fullWidth label="Company" name="company" value={row.company} onChange={(e) => handleWorkChange(index, e)} size="small" />
                                            <TextField label="Duration" name="duration" value={row.duration} onChange={(e) => handleWorkChange(index, e)} size="small" sx={{ minWidth: 100 }} />
                                            <IconButton onClick={() => removeWorkRow(index)} color="error" size="small">
                                                <Delete />
                                            </IconButton>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>

                            <Button
                                variant="contained"
                                size="large"
                                type="submit"
                                disabled={!isProfileComplete}
                                sx={{
                                    mt: 4,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    bgcolor: 'var(--color-primary)',
                                    alignSelf: 'flex-start',
                                    minWidth: 200,
                                    '&:hover': { bgcolor: '#2C1E19' }
                                }}
                            >
                                Complete Registration
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </div>
    );
}

export default CompleteProfile;
