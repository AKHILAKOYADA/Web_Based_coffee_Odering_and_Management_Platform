import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Select, MenuItem,
    CircularProgress, Alert, Snackbar, Chip, Badge, Divider,
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Avatar, Card, CardContent, Stack, FormControl, Tooltip, Grid,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import {
    Restaurant, TableRestaurant, Person, AccessTime, Fastfood,
    Logout, ListAlt, AccountCircle, Email, Phone, CalendarMonth,
    Wc, LocationOn, Dashboard, Edit, History
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const STATUS_CONFIG = {
    placed:    { label: 'New Order',  color: '#e65100', bg: '#fff3e0', border: '#ff9800' },
    preparing: { label: 'Preparing',  color: '#f57f17', bg: '#fffde7', border: '#fdd835' },
    ready:     { label: 'Ready! 🎉',  color: '#2e7d32', bg: '#e8f5e9', border: '#4caf50' },
};

function ChefDashboard() {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [newOrderSnack, setNewOrderSnack] = useState(false);
    const [newOrderCount, setNewOrderCount] = useState(0);
    const prevOrderIds = useRef(new Set());
    
    // Profile Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        phone: '',
        plotNo: '',
        street: '',
        landmark: '',
        city: '',
        pincode: ''
    });

    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchOrders(true);
        fetchProfile();
        // Poll active orders every 5 seconds
        const interval = setInterval(() => fetchOrders(false), 5000);
        return () => clearInterval(interval);
    }, [token, navigate]);

    // Fetch history when tab changes
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('http://localhost:5005/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setProfileForm({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    phone: data.phone || '',
                    plotNo: data.plotNo || '',
                    street: data.street || '',
                    landmark: data.landmark || '',
                    city: data.city || '',
                    pincode: data.pincode || ''
                });
                // Update localStorage as well
                localStorage.setItem('user', JSON.stringify(data));
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchOrders = async (isInitial = false) => {
        try {
            const res = await fetch('http://localhost:5005/api/chef/orders?scope=active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                if (!isInitial) {
                    // Detect truly new orders (IDs not seen before)
                    const incoming = new Set(data.map(o => o.id));
                    const brand_new = [...incoming].filter(id => !prevOrderIds.current.has(id));
                    if (brand_new.length > 0) {
                        setNewOrderCount(c => c + brand_new.length);
                        setNewOrderSnack(true);
                    }
                }
                prevOrderIds.current = new Set(data.map(o => o.id));
                setOrders(data);
            } else {
                if (isInitial) setError('Failed to fetch orders');
            }
        } catch (err) {
            if (isInitial) setError('Error connecting to server');
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('http://localhost:5005/api/chef/orders?scope=previous', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistoryOrders(data);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5005/api/chef/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchOrders(false);
                if (newStatus === 'ready') {
                    setSuccessMsg(`Order #${orderId} marked as Ready!`);
                }
            } else {
                setError('Failed to update order status');
            }
        } catch (err) {
            setError('Error connecting to server');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5005/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });
            if (res.ok) {
                await fetchProfile();
                setIsEditing(false);
                setSuccessMsg('Profile updated successfully!');
            } else {
                setError('Failed to update profile');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const formatTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const renderOrders = () => (
        <Box className="animate-fade-in">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#3c2a21', fontFamily: "'Playfair Display', serif" }}>
                        Kitchen Queue
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {orders.length} active order{orders.length !== 1 ? 's' : ''} • Monitoring live incoming orders
                    </Typography>
                </Box>
                <Badge badgeContent={newOrderCount} color="error">
                    <Chip label="Live Kitchen" color="success" size="small" sx={{ fontWeight: 700 }} />
                </Badge>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

            {orders.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.8)', border: '1px dashed #ccc' }}>
                    <Fastfood sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">The kitchen is clear!</Typography>
                    <Typography variant="body2" color="text.secondary">New customer orders will appear here automatically.</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#3c2a21' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Table & Customer</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Items to Prepare</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Time</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => {
                                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
                                return (
                                    <TableRow key={order.id} sx={{ bgcolor: cfg.bg + '22', '&:hover': { bgcolor: cfg.bg + '44' } }}>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '1.1rem' }}>#{order.id}</TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TableRestaurant fontSize="small" color="primary" />
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.tableLabel || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Person fontSize="small" sx={{ color: '#666' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{order.customerName}</Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ py: 1 }}>
                                                {order.items?.map((item, idx) => (
                                                    <Typography key={idx} variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                                                        <Box component="span" sx={{ color: '#d32f2f', fontWeight: 800, mr: 1 }}>{item.quantity}×</Box>
                                                        {item.name}
                                                    </Typography>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime fontSize="inherit" sx={{ color: '#999' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatTime(order.createdAt)}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={cfg.label} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: cfg.border, 
                                                    color: 'white', 
                                                    fontWeight: 800, 
                                                    fontSize: '0.65rem',
                                                    textTransform: 'uppercase'
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                                <Select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        bgcolor: 'white',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: cfg.border }
                                                    }}
                                                >
                                                    <MenuItem value="placed">📋 Placed</MenuItem>
                                                    <MenuItem value="preparing">🔥 Preparing</MenuItem>
                                                    <MenuItem value="ready">✅ Ready</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );

    const renderHistory = () => (
        <Box className="animate-fade-in">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#3c2a21', fontFamily: "'Playfair Display', serif" }}>
                    Previous Orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review orders that have been prepared and served/completed.
                </Typography>
            </Box>

            {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#3c2a21' }} />
                </Box>
            ) : historyOrders.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(255,255,255,0.8)', border: '1px dashed #ccc' }}>
                    <History sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No order history yet.</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#d4a373' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Items</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Final Time</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historyOrders.map((order) => (
                                <TableRow key={order.id} sx={{ '&:hover': { bgcolor: '#fdfbf7' } }}>
                                    <TableCell sx={{ fontWeight: 800 }}>#{order.id}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.customerName}</Typography>
                                        <Typography variant="caption" color="text.secondary">Table {order.tableLabel}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ py: 1 }}>
                                            {order.items?.map((item, idx) => (
                                                <Typography key={idx} variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                                    {item.quantity}× {item.name}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={order.status} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: order.status === 'completed' ? '#3c2a21' : '#7f5539', 
                                                color: 'white', 
                                                fontWeight: 800, 
                                                fontSize: '0.65rem',
                                                textTransform: 'uppercase'
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatTime(order.createdAt)}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );

    const renderProfile = () => (
        <Box className="animate-fade-in">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#3c2a21', fontFamily: "'Playfair Display', serif" }}>
                    My Profile
                </Typography>
                {!isEditing && (
                    <IconButton 
                        onClick={() => setIsEditing(true)}
                        sx={{ bgcolor: '#3c2a21', color: 'white', '&:hover': { bgcolor: '#513c31' }, px: 2, borderRadius: 2 }}
                    >
                        <Edit fontSize="small" />
                        <Typography variant="button" sx={{ ml: 1, fontWeight: 700 }}>Edit Profile</Typography>
                    </IconButton>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

            <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Box sx={{ p: 4, bgcolor: '#3c2a21', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar 
                        sx={{ width: 100, height: 100, bgcolor: '#d4a373', color: '#3c2a21', fontSize: '2.5rem', fontWeight: 800, border: '4px solid rgba(255,255,255,0.2)' }}
                    >
                        {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                            {user.firstName || 'Chef'} {user.lastName || 'Profile'}
                        </Typography>
                        <Chip 
                            label="Professional Chef" 
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }} 
                            size="small" 
                        />
                    </Box>
                </Box>
                
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, color: '#3c2a21' }}>
                        {isEditing ? 'Update Personal Information' : 'Personal Information'}
                    </Typography>
                    
                    {isEditing ? (
                        <Box component="form" onSubmit={handleProfileUpdate}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>First Name</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.firstName}
                                        onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Last Name</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.lastName}
                                        onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Date of Birth</Typography>
                                    <input 
                                        type="date"
                                        className="custom-input"
                                        value={profileForm.dob}
                                        onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Gender</Typography>
                                    <select 
                                        className="custom-input"
                                        value={profileForm.gender}
                                        onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Phone Number</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Plot No</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.plotNo}
                                        onChange={(e) => setProfileForm({...profileForm, plotNo: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Street</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.street}
                                        onChange={(e) => setProfileForm({...profileForm, street: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>City</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.city}
                                        onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>Pincode</Typography>
                                    <input 
                                        className="custom-input"
                                        value={profileForm.pincode}
                                        onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})}
                                    />
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <IconButton 
                                    type="submit"
                                    sx={{ bgcolor: '#d4a373', color: 'white', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#b88a5d' } }}
                                >
                                    <Typography variant="button" sx={{ fontWeight: 800 }}>Save Changes</Typography>
                                </IconButton>
                                <IconButton 
                                    onClick={() => setIsEditing(false)}
                                    sx={{ bgcolor: '#eee', color: '#666', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#ddd' } }}
                                >
                                    <Typography variant="button" sx={{ fontWeight: 800 }}>Cancel</Typography>
                                </IconButton>
                            </Box>
                        </Box>
                    ) : (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Email sx={{ color: '#d4a373' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Email Address</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.email}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Phone sx={{ color: '#d4a373' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.phone || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CalendarMonth sx={{ color: '#d4a373' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.dob || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Wc sx={{ color: '#d4a373' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Gender</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.gender || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <LocationOn sx={{ color: '#d4a373' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Work Location</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{user.city || user.street ? `${user.city || ''} ${user.street || ''}` : 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#fdfbf7' }}>
                <CircularProgress sx={{ color: '#3c2a21' }} />
            </Box>
        );
    }

    const navItems = [
        { id: 'orders', text: 'Orders Queue', icon: <ListAlt /> },
        { id: 'history', text: 'Previous Orders', icon: <History /> },
        { id: 'profile', text: 'My Profile', icon: <AccountCircle /> },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: '#fdfbf7', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: '#3c2a21',
                        color: 'white',
                        borderRight: 'none',
                        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
                    },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Restaurant sx={{ color: '#d4a373', fontSize: '2rem' }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#d4a373', letterSpacing: 2 }}>
                            CHEF
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', opacity: 0.9 }}>
                            {user.firstName} {user.lastName}
                        </Typography>
                    </Box>
                </Box>
                
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mx: 2, mb: 2 }} />

                <List sx={{ px: 2 }}>
                    {navItems.map((item) => (
                        <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => setActiveTab(item.id)}
                                sx={{
                                    borderRadius: 3, cursor: 'pointer',
                                    bgcolor: activeTab === item.id ? 'white' : 'transparent',
                                    color: activeTab === item.id ? '#3c2a21' : 'rgba(255,255,255,0.7)',
                                    '&:hover': {
                                        bgcolor: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.05)',
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ fontWeight: activeTab === item.id ? 800 : 500, fontSize: '0.9rem' }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto', p: 2 }}>
                    <ListItemButton
                        onClick={() => setLogoutDialogOpen(true)}
                        sx={{
                            borderRadius: 3, cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)',
                            transition: 'all 0.2s',
                            '&:hover': { 
                                bgcolor: 'rgba(255,255,255,0.05)',
                                color: '#ff8a80'
                            }
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                            <Logout fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }} />
                    </ListItemButton>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 4, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
                <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
                    {activeTab === 'orders' && renderOrders()}
                    {activeTab === 'history' && renderHistory()}
                    {activeTab === 'profile' && renderProfile()}
                </Box>
            </Box>

            {/* New Order Notification */}
            <Snackbar
                open={newOrderSnack}
                autoHideDuration={5000}
                onClose={() => setNewOrderSnack(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity="info"
                    variant="filled"
                    onClose={() => setNewOrderSnack(false)}
                    sx={{ fontSize: '1rem', fontWeight: 700, borderRadius: 3, bgcolor: '#d4a373', color: '#3c2a21' }}
                >
                    🍳 New order received in the kitchen!
                </Alert>
            </Snackbar>

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 4, p: 2, bgcolor: '#fdfbf7' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: '#3c2a21', fontFamily: "'Playfair Display', serif" }}>
                    Confirm Logout
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontWeight: 500, color: '#666' }}>
                        Are you sure you want to logout? Any unsaved kitchen updates might be lost.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button 
                        onClick={() => setLogoutDialogOpen(false)}
                        sx={{ color: '#666', fontWeight: 700, textTransform: 'none' }}
                    >
                        Keep Cooking
                    </Button>
                    <Button 
                        onClick={handleLogout}
                        variant="contained"
                        sx={{ 
                            bgcolor: '#d32f2f', 
                            color: 'white', 
                            fontWeight: 800, 
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#b71c1c' }
                        }}
                    >
                        Yes, Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ChefDashboard;
