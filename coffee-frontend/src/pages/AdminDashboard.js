import { useState, useEffect } from 'react';
import {
    Container, Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Switch, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Chip, IconButton,
    CircularProgress, Alert, Grid, Divider, Drawer,
    List, ListItem, ListItemIcon, ListItemText, TextField,
    Card, CardContent, Tabs, Tab, Avatar, Stack,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
    Logout, Business, Group, Visibility, CheckCircle,
    Person, Dashboard, AddCircle, Settings, PersonAdd,
    TrendingUp, PendingActions, Cancel, People, School, Work, Edit
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const DRAWER_WIDTH = 280;

const BASE = "http://localhost:5005";

const resolveSrc = (p) => {
    if (!p) return '';
    const trimmed = String(p).trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `${BASE}/${trimmed.replace(/^\/+/, '')}`;
};

// Theme Colors
const COLORS = ['#3c2a21', '#7f5539', '#d4a373', '#b08968', '#9c6644'];
const STATUS_COLORS = {
    APPROVED: '#2e7d32', // success
    PENDING: '#ed6c02',  // warning
    REJECTED: '#d32f2f'  // error
};

const ROLE_STYLES = {
    cafe_owner: {
        color: '#3C2A21', // Dark brown
        bg: '#E6CCB2',    // Light tan
        label: 'Café Owner'
    },
    customer: {
        color: '#7F5539', // Medium brown
        bg: '#EDE0D4',    // Very light tan
        label: 'Customer'
    },
    admin: {
        color: '#FFFFFF',
        bg: '#3C2A21',
        label: 'Administrator'
    }
};

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        dob: '', gender: '', plotNo: '', street: '',
        city: '', pincode: ''
    });
    const [error, setError] = useState('');
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [modalTab, setModalTab] = useState(0);

    // Create Cafe Owner State
    const [newCafeOwner, setNewCafeOwner] = useState({ firstName: '', lastName: '', email: '' });
    const [pendingCafes, setPendingCafes] = useState([]);
    const [allCafes, setAllCafes] = useState([]);
    const [cafeViewOpen, setCafeViewOpen] = useState(false);
    const [selectedCafe, setSelectedCafe] = useState(null);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE}/api/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
                localStorage.setItem('user', JSON.stringify(data));
                setProfileForm({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    plotNo: data.plotNo || '',
                    street: data.street || '',
                    city: data.city || '',
                    pincode: data.pincode || ''
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE}/api/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(profileForm)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Profile updated successfully!');
                await fetchProfile();
                setIsEditing(false);
            } else {
                throw new Error(data.message || 'Update failed');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [usersRes, analyticsRes, cafesRes, allCafesRes] = await Promise.all([
                fetch('http://localhost:5005/api/admin/users', { headers }),
                fetch('http://localhost:5005/api/admin/analytics', { headers }),
                fetch('http://localhost:5005/api/admin/cafes/pending', { headers }),
                fetch('http://localhost:5005/api/admin/cafes/all', { headers })
            ]);

            if (!usersRes.ok || !analyticsRes.ok || !cafesRes.ok || !allCafesRes.ok) throw new Error('Failed to fetch data');

            const [usersData, analyticsData, cafesData, allCafesData] = await Promise.all([
                usersRes.json(),
                analyticsRes.json(),
                cafesRes.json(),
                allCafesRes.json()
            ]);

            setUsers(usersData);
            setAnalyticsData(analyticsData);
            setPendingCafes(cafesData);
            setAllCafes(allCafesData);
            setError('');
        } catch (err) {
            console.error("Fetch Users Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Data Transformation for Charts
    const getRoleData = () => {
        const counts = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(counts).map(role => ({
            name: role.replace('_', ' ').toUpperCase(),
            value: counts[role]
        }));
    };

    const getStatusData = () => {
        if (analyticsData && analyticsData.trends) {
            return Object.keys(analyticsData.trends).sort().map(date => ({
                name: date,
                count: analyticsData.trends[date]
            }));
        }
        return [];
    };

    const statsSummary = {
        total: users.length,
        cafeOwners: users.filter(u => u.role === 'cafe_owner').length,
        customers: users.filter(u => u.role === 'customer').length,
        pending: users.filter(u => !u.isApproved && u.status !== 'rejected').length
    };

    const handleToggleStatus = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5005/api/admin/toggle-status/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error('Failed to toggle status');
        }
    };

    const handleCreateCafeOwner = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5005/api/admin/create-cafe-owner', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCafeOwner)
            });
            const data = await response.json();
            if (response.ok) {
                alert('Café Owner created and credentials sent to email!');
                setNewCafeOwner({ firstName: '', lastName: '', email: '' });
                fetchUsers();
                setActiveTab('manage');
            } else {
                throw new Error(data.message || 'Creation failed');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchUserDetails = async (id) => {
        setDetailLoading(true);
        setViewOpen(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5005/api/admin/user-details/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedUser(data);
            }
        } catch (err) {
            console.error('Failed to fetch details');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this candidate? Temporary credentials will be sent.')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5005/api/admin/approve-user/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Approved!');
                fetchUsers();
                setViewOpen(false);
            }
        } catch (err) { alert(err.message); } finally { setActionLoading(false); }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this candidate?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5005/api/admin/reject-user/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Rejected.');
                fetchUsers();
                setViewOpen(false);
            }
        } catch (err) { alert(err.message); } finally { setActionLoading(false); }
    };
    const handleApproveCafe = async (id) => {
        if (!window.confirm('Approve this café?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5005/api/admin/cafes/approve/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Café approved!');
                fetchUsers();
            }
        } catch (err) { alert(err.message); } finally { setActionLoading(false); }
    };
    const fetchCafeDetails = async (id) => {
        setCafeViewOpen(true);
        setDetailLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5005/api/admin/cafes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedCafe(data);
            }
        } catch (err) {
            console.error('Failed to fetch cafe details');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="text.secondary" variant="overline" sx={{ fontWeight: 700 }}>{title}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const renderOverview = () => (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>Admin's Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">Welcome back! Here's what's happening today.</Typography>
                </Box>
                <Box>
                    <Chip label={new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 2, mb: 4 }}>
                <Box sx={{ height: 120 }}>
                    <StatCard title="Total Users" value={statsSummary.total} icon={<People />} color="#3c2a21" />
                </Box>
                <Box sx={{ height: 120 }}>
                    <StatCard title="Pending Approvals" value={statsSummary.pending} icon={<PendingActions />} color="#ed6c02" />
                </Box>
                <Box sx={{ height: 120 }}>
                    <StatCard title="Café Owners" value={statsSummary.cafeOwners} icon={<Business />} color="#d4a373" />
                </Box>
                <Box sx={{ height: 120 }}>
                    <StatCard title="Customers" value={statsSummary.customers} icon={<Person />} color="#7f5539" />
                </Box>
                <Box sx={{ height: 120 }}>
                    <StatCard title="Cafés" value={allCafes.length} icon={<Business />} color="#3c2a21" />
                </Box>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'white', border: '1px solid rgba(0,0,0,0.05)', width: '100%', mt: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
                    <Box>
                        <Paper sx={{ p: 3, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', height: 360 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: 'var(--color-primary)' }}>
                                Registration Trends (Last 7 Days)
                            </Typography>
                            <Box sx={{ width: '100%', height: 'calc(100% - 36px)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getStatusData()} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600 }} />
                                        <Tooltip cursor={{ fill: 'rgba(212, 163, 115, 0.1)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--color-primary)" />
                                                    <stop offset="100%" stopColor="var(--color-secondary)" />
                                                </linearGradient>
                                            </defs>
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Box>
                    <Box>
                        <Paper sx={{ p: 3, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', height: 360 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: 'var(--color-primary)' }}>
                                Role Distribution
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 2, height: 'calc(100% - 36px)' }}>
                                <Box sx={{ height: '100%', minWidth: 0, minHeight: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getRoleData()}
                                                cx="50%" cy="50%"
                                                innerRadius={0}
                                                outerRadius={120}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {getRoleData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                                    {getRoleData().map((entry, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.name}</Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">{entry.value}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );

    const renderAnalytics = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 1 }}>Detailed Analytics</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>In-depth insights into your cafe network growth and user engagement.</Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 4, borderRadius: 4, height: 350 }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 700 }}>Growth Metrics</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">New Users (Month)</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>+12%</Typography>
                                <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} /> <Typography variant="caption" color="success.main">Trending Up</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Conversion Rate</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>84%</Typography>
                                <CheckCircle sx={{ color: 'primary.main', fontSize: 16 }} /> <Typography variant="caption" color="primary.main">High Stability</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 4, borderRadius: 4, height: 350 }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 700 }}>System Activity</Typography>
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Database Health</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>98%</Typography>
                            </Box>
                            <Box sx={{ height: 8, bgcolor: '#f0f0f0', borderRadius: 4, mb: 3 }}>
                                <Box sx={{ height: '100%', width: '98%', bgcolor: 'success.main', borderRadius: 4 }}></Box>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Server Response Time</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>240ms</Typography>
                            </Box>
                            <Box sx={{ height: 8, bgcolor: '#f0f0f0', borderRadius: 4 }}>
                                <Box sx={{ height: '100%', width: '70%', bgcolor: 'primary.main', borderRadius: 4 }}></Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );

    const renderApprovals = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 1 }}>Candidate Approvals</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Review pending registrations from Customers and Café Owners.</Typography>

            <Grid container spacing={3}>
                {users.filter(u => !u.isApproved && u.status !== 'rejected').map((user) => (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                        <Card sx={{ borderRadius: 4, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                    <Avatar sx={{
                                        bgcolor: ROLE_STYLES[user.role]?.bg || 'var(--color-secondary)',
                                        color: ROLE_STYLES[user.role]?.color || 'white',
                                        width: 50, height: 50, fontWeight: 700
                                    }}>
                                        {user.firstName[0]}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{user.firstName} {user.lastName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2, opacity: 0.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip
                                        label={ROLE_STYLES[user.role]?.label || user.role.toUpperCase()}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.65rem',
                                            bgcolor: ROLE_STYLES[user.role]?.bg || 'rgba(0,0,0,0.08)',
                                            color: ROLE_STYLES[user.role]?.color || 'inherit'
                                        }}
                                    />
                                    <Button variant="contained" size="small" onClick={() => fetchUserDetails(user.id)} sx={{ bgcolor: 'var(--color-primary)', textTransform: 'none', borderRadius: 2 }}>
                                        Review App
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Typography variant="h5" sx={{ mt: 5, mb: 2, fontWeight: 800 }}>Pending Cafés</Typography>
            <Grid container spacing={3}>
                {pendingCafes.map((cafe) => (
                    <Grid item xs={12} sm={6} md={4} key={cafe.id}>
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#E6CCB2', color: '#3C2A21', fontWeight: 700 }}>
                                        {cafe.cafeName?.[0] || 'C'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{cafe.cafeName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{cafe.ownerName} • {cafe.email}</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip label={`${cafe.city || '-'}, ${cafe.state || '-'}`} size="small" />
                                    <Chip label={`Status: ${cafe.status}`} size="small" color="warning" />
                                    <Chip label={`Verification: ${cafe.verificationStatus}`} size="small" color="info" />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Button variant="contained" color="success" onClick={() => handleApproveCafe(cafe.id)} disabled={actionLoading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Approve Café'}
                                    </Button>
                                    <Button variant="outlined" onClick={() => fetchCafeDetails(cafe.id)} sx={{ textTransform: 'none', borderRadius: 2 }}>
                                        View Details
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {pendingCafes.length === 0 && (
                    <Grid item xs={12}>
                        <Alert severity="info">No pending cafés.</Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );

    const renderCafes = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 1 }}>Cafés</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Browse all registered cafés.</Typography>
            <Grid container spacing={3}>
                {allCafes.map((cafe) => (
                    <Grid item xs={12} sm={4} md={4} key={cafe.id}>
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar sx={{ bgcolor: '#E6CCB2', color: '#3C2A21', fontWeight: 700 }}>
                                        {cafe.cafeName?.[0] || 'C'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{cafe.cafeName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{cafe.ownerName} • {cafe.email}</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip label={`${cafe.city || '-'}, ${cafe.state || '-'}`} size="small" />
                                    <Chip label={`Status: ${cafe.status}`} size="small" color={cafe.status === 'active' ? 'success' : 'warning'} />
                                    <Chip label={`Verification: ${cafe.verificationStatus}`} size="small" color={cafe.verificationStatus === 'verified' ? 'success' : 'info'} />
                                </Box>
                                {cafe.verificationStatus !== 'verified' && (
                                    <Button variant="contained" color="success" onClick={() => handleApproveCafe(cafe.id)} disabled={actionLoading} sx={{ textTransform: 'none', borderRadius: 2 }}>
                                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Approve'}
                                    </Button>
                                )}
                                <Button variant="outlined" onClick={() => fetchCafeDetails(cafe.id)} sx={{ textTransform: 'none', borderRadius: 2, ml: 1 }}>
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {allCafes.length === 0 && (
                    <Grid item xs={12}>
                        <Alert severity="info">No cafés found.</Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );

    const renderCreateCafeOwner = () => (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <PersonAdd sx={{ fontSize: 50, color: 'var(--color-primary)', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Create Café Owner</Typography>
                    <Typography variant="body2" color="text.secondary">Account will be pre-approved. Credentials will be emailed.</Typography>
                </Box>
                <form onSubmit={handleCreateCafeOwner}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField fullWidth label="First Name" value={newCafeOwner.firstName} onChange={(e) => setNewCafeOwner({ ...newCafeOwner, firstName: e.target.value })} required />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Last Name" value={newCafeOwner.lastName} onChange={(e) => setNewCafeOwner({ ...newCafeOwner, lastName: e.target.value })} required />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Email Address" type="email" value={newCafeOwner.email} onChange={(e) => setNewCafeOwner({ ...newCafeOwner, email: e.target.value })} required />
                        </Grid>
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" type="submit" disabled={actionLoading} sx={{ mt: 2, py: 1.5, bgcolor: 'var(--color-primary)', borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                                {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Create & Send Credentials'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );

    const renderManageAccounts = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 1 }}>Verified Directory</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Manage active and deactivated accounts in the system.</Typography>

            <Grid container spacing={3}>
                {users.filter(u => u.isApproved || u.status === 'rejected').map((user) => (
                    <Grid item xs={12} sm={6} md={4} key={user.id}>
                        <Card sx={{ borderRadius: 4, opacity: user.status === 'active' ? 1 : 0.7, bgcolor: user.status === 'active' ? 'white' : '#f5f5f5' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Avatar sx={{
                                        bgcolor: ROLE_STYLES[user.role]?.bg || 'var(--color-secondary)',
                                        color: ROLE_STYLES[user.role]?.color || 'white',
                                        fontWeight: 700
                                    }}>
                                        {user.firstName[0]}
                                    </Avatar>
                                    <Switch
                                        checked={user.status === 'active'}
                                        onChange={() => handleToggleStatus(user.id)}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{user.firstName} {user.lastName}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>{user.email}</Typography>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip
                                        label={ROLE_STYLES[user.role]?.label || user.role.toUpperCase()}
                                        size="small"
                                        sx={{
                                            fontSize: '0.6rem',
                                            fontWeight: 800,
                                            bgcolor: ROLE_STYLES[user.role]?.bg || 'rgba(0,0,0,0.08)',
                                            color: ROLE_STYLES[user.role]?.color || 'inherit'
                                        }}
                                    />
                                    <Chip
                                        label={user.status.toUpperCase()}
                                        size="small"
                                        color={user.status === 'active' ? 'success' : 'default'}
                                        sx={{ fontSize: '0.6rem', fontWeight: 700 }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    const renderProfile = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                    Admin Profile
                </Typography>
                {!isEditing && (
                    <Button 
                        variant="contained"
                        onClick={() => setIsEditing(true)}
                        startIcon={<Edit />}
                        sx={{ bgcolor: 'var(--color-primary)', color: 'white', '&:hover': { bgcolor: '#2C1E19' }, px: 3, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                        Edit Profile
                    </Button>
                )}
            </Box>

            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Box sx={{ p: 4, bgcolor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar 
                        sx={{ width: 100, height: 100, bgcolor: 'white', color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800 }}
                    >
                        {userData.firstName?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                            {userData.firstName || 'Admin'} {userData.lastName || ''}
                        </Typography>
                        <Chip 
                            label="System Administrator" 
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} 
                            size="small" 
                        />
                    </Box>
                </Box>
                
                <CardContent sx={{ p: 4 }}>
                    {isEditing ? (
                        <Box component="form" onSubmit={handleProfileUpdate}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="First Name" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Last Name" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} value={profileForm.dob} onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Gender</InputLabel>
                                        <Select value={profileForm.gender} label="Gender" onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}>
                                            <MenuItem value="male">Male</MenuItem>
                                            <MenuItem value="female">Female</MenuItem>
                                            <MenuItem value="other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Phone Number" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="City" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} />
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Button type="submit" variant="contained" sx={{ bgcolor: 'var(--color-primary)', color: 'white', px: 4, py: 1, borderRadius: 2, fontWeight: 800 }}>Save Changes</Button>
                                <Button onClick={() => setIsEditing(false)} variant="outlined" sx={{ px: 4, py: 1, borderRadius: 2, fontWeight: 800 }}>Cancel</Button>
                            </Box>
                        </Box>
                    ) : (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Email Address</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{userData.email}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{userData.phone || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Gender</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{userData.gender || 'N/A'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">City</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{userData.city || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
        </Box>
    );

    if (!localStorage.getItem('token')) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" color="error">Access Denied</Typography>
                <Typography>Please log in to access the administrator dashboard.</Typography>
                <Button variant="contained" onClick={() => navigate('/login')} sx={{ bgcolor: 'var(--color-primary)' }}>
                    Go to Login
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: 'rgba(60, 42, 33, 0.95)', // Rich coffee brown with slight transparency
                        color: 'white',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)'
                    },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 2 }}>
                    <Box sx={{ bgcolor: 'var(--color-secondary)', p: 1, borderRadius: 2, display: 'flex' }}>
                        <Business sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif", letterSpacing: 1, color: 'white' }}>
                        CafeAdmin
                    </Typography>
                </Box>
                <List sx={{ px: 2 }}>
                    {[
                        { text: 'Overview', icon: <Dashboard />, id: 'overview' },
                        { text: 'Analytics', icon: <TrendingUp />, id: 'analytics' },
                        { text: 'Pending Approvals', icon: <CheckCircle />, id: 'approvals' },
                        { text: 'Verified Directory', icon: <Group />, id: 'manage' },
                        { text: 'Cafés', icon: <Business />, id: 'cafes' },
                        { text: 'Create Café Owner', icon: <PersonAdd />, id: 'create' },
                        { text: 'My Profile', icon: <Person />, id: 'profile' },
                    ].map((item) => (
                        <ListItem
                            button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            sx={{
                                borderRadius: 2, mb: 1, py: 1.2, cursor: 'pointer',
                                bgcolor: activeTab === item.id ? 'rgba(212, 163, 115, 0.2)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ListItemIcon sx={{ color: activeTab === item.id ? 'var(--color-secondary)' : 'white', minWidth: 45 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontWeight: activeTab === item.id ? 700 : 500,
                                    fontSize: '0.95rem'
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ mt: 'auto', p: 3 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        startIcon={<Logout />}
                        onClick={() => setLogoutDialogOpen(true)}
                        sx={{
                            borderColor: 'rgba(255,255,255,0.3)',
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                px: 1,
                py: 4,
                bgcolor: '#fcfaf7',
                minHeight: '100vh',
                animation: 'fadeIn 0.5s ease-in-out'
            }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                        <CircularProgress color="primary" />
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'approvals' && renderApprovals()}
                        {activeTab === 'analytics' && renderAnalytics()}
                        {activeTab === 'create' && renderCreateCafeOwner()}
                        {activeTab === 'manage' && renderManageAccounts()}
                        {activeTab === 'cafes' && renderCafes()}
                        {activeTab === 'profile' && renderProfile()}
                    </>
                )}
            </Box>

            {/* View Details Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, height: '80vh' } }}>
                <DialogTitle sx={{ bgcolor: 'var(--color-primary)', color: 'white', p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{
                                bgcolor: selectedUser?.profile?.role ? ROLE_STYLES[selectedUser.profile.role]?.bg : 'white',
                                color: selectedUser?.profile?.role ? ROLE_STYLES[selectedUser.profile.role]?.color : 'var(--color-primary)',
                                fontWeight: 700
                            }}>
                                {selectedUser?.profile?.firstName?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedUser?.profile?.firstName} {selectedUser?.profile?.lastName}</Typography>
                                <Typography variant="caption">{selectedUser?.profile?.email}</Typography>
                            </Box>
                        </Box>
                        <Chip
                            label={selectedUser?.profile?.role ? ROLE_STYLES[selectedUser.profile.role]?.label : selectedUser?.profile?.role?.toUpperCase()}
                            size="small"
                            sx={{
                                bgcolor: selectedUser?.profile?.role ? ROLE_STYLES[selectedUser.profile.role]?.bg : 'rgba(255,255,255,0.2)',
                                color: selectedUser?.profile?.role ? ROLE_STYLES[selectedUser.profile.role]?.color : 'white',
                                fontWeight: 700,
                                border: '1px solid rgba(255,255,255,0.3)'
                            }}
                        />
                    </Box>
                </DialogTitle>
                <Tabs value={modalTab} onChange={(e, v) => setModalTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab label="Personal" />
                    <Tab label="Academic" />
                    <Tab label="Experience" />
                    <Tab label="Documents" />
                </Tabs>
                <DialogContent sx={{ p: 4 }}>
                    {detailLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                    ) : selectedUser && (
                        <Box>
                            {modalTab === 0 && (
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Date of Birth</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>{selectedUser.profile.dob}</Typography>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Gender</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUser.profile.gender}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Address</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {selectedUser.profile.plotNo}, {selectedUser.profile.street}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUser.profile.city}, {selectedUser.profile.pincode}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 1, color: 'var(--color-secondary)' }}>
                                            Near {selectedUser.profile.landmark}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            )}
                            {modalTab === 1 && (
                                <List>
                                    {selectedUser.academicInfo.map((edu, idx) => (
                                        <ListItem key={idx} sx={{ bgcolor: '#fcfaf7', mb: 1, borderRadius: 2 }}>
                                            <ListItemIcon><School /></ListItemIcon>
                                            <ListItemText primary={edu.degree} secondary={`${edu.institution} (${edu.passingYear})`} />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            {modalTab === 2 && (
                                <List>
                                    {selectedUser.workExperience.length > 0 ? selectedUser.workExperience.map((work, idx) => (
                                        <ListItem key={idx} sx={{ bgcolor: '#fcfaf7', mb: 1, borderRadius: 2 }}>
                                            <ListItemIcon><Work /></ListItemIcon>
                                            <ListItemText primary={work.role} secondary={`${work.company} - ${work.duration}`} />
                                        </ListItem>
                                    )) : <Typography color="text.secondary">No experience listed.</Typography>}
                                </List>
                            )}
                            {modalTab === 3 && (
                                <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {selectedUser.profile.govtProofFile ? (
                                        <iframe
                                            src={resolveSrc(selectedUser.profile.govtProofFile)}
                                            width="100%"
                                            height="100%"
                                            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                                            title="Govt ID Proof"
                                        />
                                    ) : (
                                        <Typography align="center" sx={{ mt: 5 }}>No document uploaded.</Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button onClick={() => setViewOpen(false)} variant="text">Cancel</Button>
                    <Box sx={{ flex: 1 }} />
                    <Button variant="outlined" color="error" onClick={() => handleReject(selectedUser?.profile?.id)} disabled={actionLoading}>Reject Candidate</Button>
                    <Button variant="contained" color="success" onClick={() => handleApprove(selectedUser?.profile?.id)} disabled={actionLoading} sx={{ minWidth: 150 }}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Approve & Onboard'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Cafe Details Dialog */}
            <Dialog open={cafeViewOpen} onClose={() => setCafeViewOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, height: '80vh' } }}>
                <DialogTitle sx={{ bgcolor: 'var(--color-primary)', color: 'white', p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#E6CCB2', color: '#3C2A21', fontWeight: 700 }}>
                                {selectedCafe?.cafeName?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedCafe?.cafeName}</Typography>
                                <Typography variant="caption">{selectedCafe?.ownerName} • {selectedCafe?.email}</Typography>
                            </Box>
                        </Box>
                        <Chip
                            label={selectedCafe?.verificationStatus}
                            size="small"
                            sx={{
                                bgcolor: selectedCafe?.verificationStatus === 'verified' ? 'rgba(46,125,50,0.2)' : 'rgba(237,108,2,0.2)',
                                color: selectedCafe?.verificationStatus === 'verified' ? '#2e7d32' : '#ed6c02',
                                fontWeight: 700,
                                border: '1px solid rgba(255,255,255,0.3)'
                            }}
                        />
                    </Box>
                </DialogTitle>
                <Tabs value={modalTab} onChange={(e, v) => setModalTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tab label="Basics" />
                    <Tab label="Address" />
                    <Tab label="Business" />
                    <Tab label="Photos" />
                </Tabs>
                <DialogContent sx={{ p: 4 }}>
                    {detailLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                    ) : selectedCafe && (
                        <Box>
                            {modalTab === 0 && (
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Owner</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>{selectedCafe.ownerName}</Typography>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Contact</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedCafe.contactNumber}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Timings</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Open: {selectedCafe.openingTime}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Close: {selectedCafe.closingTime}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                            <Chip label={`Delivery: ${selectedCafe.hasHomeDelivery ? 'Yes' : 'No'}`} size="small" />
                                            <Chip label={`Takeaway: ${selectedCafe.hasTakeaway ? 'Yes' : 'No'}`} size="small" />
                                            <Chip label={`Dine-In: ${selectedCafe.hasDineIn ? 'Yes' : 'No'}`} size="small" />
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                            {modalTab === 1 && (
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Address</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedCafe.street}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedCafe.city}, {selectedCafe.state} - {selectedCafe.pincode}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Capacity</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Tables: {selectedCafe.totalTables || '-'}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Seating: {selectedCafe.seatingCapacity || '-'}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                            <Chip label={`Parking: ${selectedCafe.parkingAvailable ? 'Yes' : 'No'}`} size="small" />
                                            <Chip label={`WiFi: ${selectedCafe.freeWifi ? 'Yes' : 'No'}`} size="small" />
                                            <Chip label={`AC: ${selectedCafe.airConditioned ? 'Yes' : 'No'}`} size="small" />
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                            {modalTab === 2 && (
                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Business</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Type: {selectedCafe.businessType}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>FSSAI: {selectedCafe.fssaiLicenseNumber}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>GST: {selectedCafe.gstNumber || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Payments</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Account: {selectedCafe.accountNumber || '-'}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>IFSC: {selectedCafe.ifscCode || '-'}</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>UPI: {selectedCafe.upiId || '-'}</Typography>
                                    </Grid>
                                </Grid>
                            )}
                            {modalTab === 3 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Logo</Typography>
                                        {selectedCafe.cafeLogo ? <img alt="Logo" src={resolveSrc(selectedCafe.cafeLogo)} style={{ width: '100%', borderRadius: 8, border: '1px solid #eee' }} /> : <Typography color="text.secondary">No logo</Typography>}
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Exterior</Typography>
                                        {selectedCafe.exteriorPhoto ? <img alt="Exterior" src={resolveSrc(selectedCafe.exteriorPhoto)} style={{ width: '100%', borderRadius: 8, border: '1px solid #eee' }} /> : <Typography color="text.secondary">No photo</Typography>}
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Interior</Typography>
                                        {selectedCafe.interiorPhoto ? <img alt="Interior" src={resolveSrc(selectedCafe.interiorPhoto)} style={{ width: '100%', borderRadius: 8, border: '1px solid #eee' }} /> : <Typography color="text.secondary">No photo</Typography>}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Food Photos</Typography>
                                        {selectedCafe.foodPhotos ? (
                                            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                                {selectedCafe.foodPhotos.split(',').map((p, i) => (
                                                    <Grid item key={i}>
                                                        <img alt={"Food " + (i + 1)} src={resolveSrc(p)} style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        ) : <Typography color="text.secondary">No food photos</Typography>}
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, mt: 2 }}>Menu</Typography>
                                        {selectedCafe.menuFile ? <a href={resolveSrc(selectedCafe.menuFile)} target="_blank" rel="noreferrer">Open Menu</a> : <Typography color="text.secondary">No menu</Typography>}
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button onClick={() => setCafeViewOpen(false)} variant="text">Close</Button>
                    <Box sx={{ flex: 1 }} />
                    {selectedCafe?.verificationStatus !== 'verified' && (
                        <Button variant="contained" color="success" onClick={() => handleApproveCafe(selectedCafe?.id)} disabled={actionLoading} sx={{ minWidth: 150 }}>
                            {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Approve Café'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ── Logout confirmation dialog ────────────────────────────── */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#3c2a21', textAlign: 'center', pb: 1 }}>
                    Confirm Logout
                </DialogTitle>
                <DialogContent>
                    <Typography textAlign="center" color="text.secondary">
                        Are you sure you want to log out? You will need to sign in again to access the administrator portal.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, px: 3 }}>
                    <Button
                        onClick={() => setLogoutDialogOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary', px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="contained"
                        sx={{
                            bgcolor: '#3c2a21',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 4,
                            '&:hover': { bgcolor: '#2C1E19' }
                        }}
                    >
                        Yes, Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AdminDashboard;

