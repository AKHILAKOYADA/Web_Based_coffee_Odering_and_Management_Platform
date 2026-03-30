import React, { useState, useEffect } from 'react';
import { 
    Container, Box, Typography, Paper, Grid, TextField, 
    Button, MenuItem, Stack, Alert, CircularProgress, IconButton, Chip, Card, CardContent 
} from '@mui/material';
import { ArrowBack, TableRestaurant, Event, AccessTime, Person, Phone, Add, Remove } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function BookTable() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const cafeId = queryParams.get('cafeId');
    const preselectedTableId = queryParams.get('tableId');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [cafe, setCafe] = useState(null);
    const [tables, setTables] = useState([]);
    const [menu, setMenu] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        tableId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '12:00',
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        customerPhone: user.phone || ''
    });
    const [cart, setCart] = useState([]);

    useEffect(() => {
        if (!cafeId) {
            navigate('/dashboard');
            return;
        }
        fetchCafeDetails();
        try {
            const saved = JSON.parse(localStorage.getItem('prebookCart') || '[]');
            if (Array.isArray(saved)) setCart(saved);
        } catch {}
        if (preselectedTableId) {
            setFormData((prev) => ({ ...prev, tableId: preselectedTableId }));
        }
    }, [cafeId, preselectedTableId]);

    const fetchCafeDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5005/api/cafes/${cafeId}/details`);
            if (res.ok) {
                const data = await res.json();
                setCafe(data);
                setTables(data.tables || []);
                setMenu(data.menu || []);
            } else {
                setError('Failed to load cafe details');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        setCart((prev) => {
            const ex = prev.find((p) => p.id === item.id);
            if (ex) {
                return prev.map((p) => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price || 0, quantity: 1 }];
        });
    };

    const decFromCart = (itemId) => {
        setCart((prev) => {
            const ex = prev.find((p) => p.id === itemId);
            if (!ex) return prev;
            if (ex.quantity <= 1) {
                return prev.filter((p) => p.id !== itemId);
            }
            return prev.map((p) => p.id === itemId ? { ...p, quantity: p.quantity - 1 } : p);
        });
    };

    const selectedTable = tables.find(t => String(t.id) === String(formData.tableId));
    const tableAmount = selectedTable ? (selectedTable.price || 0) : 0;
    const itemsAmount = cart.reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0);
    const totalAmount = tableAmount + itemsAmount;

    const _createBooking = async (paymentResponse) => {
        setBookingLoading(true);
        setError('');
        
        try {
            const payload = {
                ...formData,
                userEmail: user.email || '',
                items: cart.map((it) => ({ menuItemId: it.id, quantity: it.quantity })),
                payment: paymentResponse
            };
            const res = await fetch('http://localhost:5005/api/cafes/prebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                setSuccess(true);
                try { localStorage.removeItem('prebookCart'); } catch {}
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                const msg = await res.text();
                setError(msg || 'Failed to book table');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setBookingLoading(false);
            setPaymentLoading(false);
        }
    };

    const handlePayment = async (bypass = false) => {
        setPaymentLoading(true);
        setError('');
        setShowBypass(false);

        if (bypass) {
            // Skip Razorpay and go straight to success for testing
            handleBooking(null, { razorpay_order_id: "mock_rp_order_" + Date.now(), razorpay_payment_id: "mock_payment_id_" + Date.now(), razorpay_signature: "mock_sig" });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onerror = () => {
            setError('Razorpay SDK failed to load. Are you online?');
            setPaymentLoading(false);
        };
        script.onload = async () => {
            try {
                const orderRes = await fetch('http://localhost:5005/api/payment/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: totalAmount }) // Backend does the * 100
                });

                if (!orderRes.ok) {
                    setShowBypass(true); // Allow bypass on error
                    throw new Error('Failed to create payment order');
                }

                const orderData = await orderRes.json();

                const options = {
                    key: orderData.key_id || 'rzp_test_SQMtX9pLfcbNhR', // Use order key or fallbacktest key
                    amount: orderData.amount,
                    currency: 'INR',
                    name: `${cafe.name} Booking`,
                    description: 'Table and Item Pre-booking',
                    order_id: orderData.id,
                    handler: function (response) {
                        fetch('http://localhost:5005/api/payment/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...response, razorpay_order_id: orderData.id })
                        }).then(res => res.json()).then(data => {
                            alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
                            handleBooking(null, { ...response, razorpay_order_id: orderData.id });
                        }).catch(err => {
                            setError('Payment verification failed');
                        });
                    },
                    modal: {
                        ondismiss: function() {
                            setPaymentLoading(false);
                        }
                    },
                    prefill: {
                        name: formData.customerName,
                        email: user.email || '',
                        contact: formData.customerPhone
                    },
                    theme: {
                        color: '#3399cc'
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    setError('Payment failed: ' + response.error.description);
                });
                rzp.open();
            } catch (err) {
                setShowBypass(true); // Allow bypass on catch
                setError(err.message || 'Payment failed');
                setPaymentLoading(false);
            }
        };

        document.body.appendChild(script);
    };

    const [showBypass, setShowBypass] = useState(false);

    const handleBooking = async (e, forceBypass = false) => {
        if (e) e.preventDefault();
        
        if (forceBypass) {
            handlePayment(true);
            return;
        }

        handlePayment();
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#fcfaf7', minHeight: '100vh', py: 6 }}>
            <Container maxWidth="md">
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate('/dashboard')}
                    sx={{ mb: 4, color: 'text.secondary', textTransform: 'none' }}
                >
                    Back to Dashboard
                </Button>

                <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 1 }}>
                        Book a Table
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {cafe?.name} • {cafe?.city}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                            {showBypass && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    sx={{ ml: 2 }}
                                    onClick={() => handleBooking(null, true)}
                                >
                                    Bypass Payment (Demo Mode)
                                </Button>
                            )}
                        </Alert>
                    )}
                    {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Table booked successfully! Redirecting...</Alert>}

                    <form onSubmit={handleBooking}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Date"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    InputProps={{ startAdornment: <Event sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="time"
                                    label="Start Time"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    InputProps={{ startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Your Name"
                                    required
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    required
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                    InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                    Add Items To Prebook
                                </Typography>
                                <Grid container spacing={2}>
                                    {menu.map((item) => {
                                        const inCart = cart.find((c) => c.id === item.id);
                                        return (
                                            <Grid item xs={12} sm={6} md={3} key={item.id}>
                                                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                                                            <Typography variant="body2" color="text.secondary">₹{item.price}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {!inCart ? (
                                                                <Button variant="outlined" size="small" onClick={() => addToCart(item)} sx={{ textTransform: 'none' }}>
                                                                    Add
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    <IconButton size="small" onClick={() => decFromCart(item.id)}>
                                                                        <Remove />
                                                                    </IconButton>
                                                                    <Chip label={inCart.quantity} />
                                                                    <IconButton size="small" onClick={() => addToCart(item)}>
                                                                        <Add />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                    {menu.length === 0 && (
                                        <Grid item xs={12}>
                                            <Typography color="text.secondary">No menu items available.</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Table Cost: ₹{tableAmount.toFixed(2)}</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Items: ₹{itemsAmount.toFixed(2)}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                Total Items: {cart.reduce((s, c) => s + c.quantity, 0)}
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--color-primary)' }}>
                                                ₹{totalAmount.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={bookingLoading || paymentLoading || success || (cart.length === 0 && !formData.tableId)}
                                    sx={{ 
                                        py: 2, 
                                        bgcolor: 'var(--color-primary)', 
                                        borderRadius: 3,
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#2C1E19' }
                                    }}
                                >
                                    {paymentLoading ? <CircularProgress size={26} color="inherit" /> : (bookingLoading ? <CircularProgress size={26} color="inherit" /> : 'Confirm & Pay')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}

export default BookTable;
