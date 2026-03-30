import React from "react";
import {
    Container, Box, Typography, Card, CardContent, Button, Grid,
    TextField, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, Stack, Divider, IconButton, CircularProgress,
    CardMedia, Tab, Tabs, List, ListItem, ListItemText, Avatar, Paper, Drawer, ListItemIcon,
    Collapse, Tooltip
} from "@mui/material";
import {
    Person as PersonIcon, TableRestaurant, Coffee, ShoppingCart,
    AccessTime, LocationOn, Close, Fastfood, Info, NavigateBefore, NavigateNext, Image, Dashboard,
    History, ExpandMore, ExpandLess, Receipt, CheckCircle, Cancel, HourglassEmpty, Store, Replay,
    Email, Phone, CalendarMonth, Wc, Edit
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const BASE = 'http://localhost:5005';

const resolveSrc = (p) => {
    if (!p) return '';
    const trimmed = String(p).trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `${BASE}/${trimmed.replace(/^\/+/, '')}`;
};

// ─────────────────────────── Image Carousels ────────────────────────────────
const MenuImageCarousel = ({ item }) => {
    const [index, setIndex] = React.useState(0);
    const paths = item.imagePaths || [];
    if (paths.length === 0) {
        return (
            <Box sx={{ width: "100%", height: "100%", bgcolor: "#fcfaf7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Fastfood sx={{ color: "#e6ccb2" }} />
            </Box>
        );
    }
    const next = (e) => { e.stopPropagation(); setIndex((index + 1) % paths.length); };
    const prev = (e) => { e.stopPropagation(); setIndex((index - 1 + paths.length) % paths.length); };
    return (
        <Box sx={{ position: 'relative', width: "100%", height: "100%", overflow: 'hidden', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img alt={item.name} src={resolveSrc(paths[index])} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {paths.length > 1 && (
                <>
                    <IconButton size="small" onClick={prev} sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.4)', p: 0.2, '&:hover': { bgcolor: 'rgba(255,255,255,0.7)' } }}>
                        <NavigateBefore fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={next} sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.4)', p: 0.2, '&:hover': { bgcolor: 'rgba(255,255,255,0.7)' } }}>
                        <NavigateNext fontSize="small" />
                    </IconButton>
                    <Box sx={{ position: 'absolute', bottom: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', px: 0.5, py: 0.1, borderRadius: 1, fontSize: '0.6rem' }}>
                        {index + 1}/{paths.length}
                    </Box>
                </>
            )}
        </Box>
    );
};

const CafeImageCarousel = ({ paths }) => {
    const list = Array.isArray(paths) ? paths : (typeof paths === "string" ? paths.split(",").filter(Boolean) : []);
    const [index, setIndex] = React.useState(0);
    if (list.length === 0) {
        return (
            <Box sx={{ width: "100%", height: 180, bgcolor: "#fcfaf7", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3, border: "1px dashed #eee" }}>
                <Image sx={{ color: "#e6ccb2" }} />
            </Box>
        );
    }
    const next = (e) => { e.stopPropagation(); setIndex((index + 1) % list.length); };
    const prev = (e) => { e.stopPropagation(); setIndex((index - 1 + list.length) % list.length); };
    return (
        <Box sx={{ position: "relative", width: "100%", height: 180, overflow: "hidden", borderRadius: 3, bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img alt="" src={resolveSrc(list[index])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {list.length > 1 && (
                <>
                    <IconButton size="small" onClick={prev} sx={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.5)", '&:hover': { bgcolor: "rgba(255,255,255,0.8)" } }}>
                        <NavigateBefore fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={next} sx={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.5)", '&:hover': { bgcolor: "rgba(255,255,255,0.8)" } }}>
                        <NavigateNext fontSize="small" />
                    </IconButton>
                </>
            )}
            <Box sx={{ position: "absolute", bottom: 6, right: 6, bgcolor: "rgba(0,0,0,0.5)", color: "white", px: 0.6, py: 0.2, borderRadius: 1, fontSize: "0.65rem" }}>
                {index + 1}/{list.length}
            </Box>
        </Box>
    );
};

// ─────────────────────────── Order Status Helper ─────────────────────────────
const StatusChip = ({ status }) => {
    const map = {
        placed: { color: "info", label: "Placed", icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
        preparing: { color: "warning", label: "Preparing", icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
        ready: { color: "success", label: "Ready", icon: <CheckCircle sx={{ fontSize: 14 }} /> },
        served: { color: "success", label: "Served", icon: <CheckCircle sx={{ fontSize: 14 }} /> },
        completed: { color: "success", label: "Completed", icon: <CheckCircle sx={{ fontSize: 14 }} /> },
        cancelled: { color: "error", label: "Cancelled", icon: <Cancel sx={{ fontSize: 14 }} /> },
    };
    const s = status?.toLowerCase();
    const { color = "default", label = status, icon } = map[s] || {};
    return <Chip icon={icon} label={label} color={color} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />;
};

const PaymentChip = ({ status }) => {
    const map = {
        paid: { color: "success", label: "Paid" },
        pending: { color: "warning", label: "Pending" },
        failed: { color: "error", label: "Failed" },
    };
    const s = status?.toLowerCase();
    const { color = "default", label = status } = map[s] || {};
    return <Chip label={label} color={color} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />;
};

// ─────────────────────────── Single Order Card ───────────────────────────────
const OrderCard = ({ order, BASE, navigate }) => {
    const [expanded, setExpanded] = React.useState(false);
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const time = order.createdAt ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

    const handleReorder = () => {
        // Build cart items from the order — using item names + prices
        // CafeDetails will look up real menuItem IDs from the menu after loading
        const reorderCart = (order.items || []).map((it) => ({
            name: it.itemName,
            price: Number(it.price || 0) / (it.quantity || 1), // unit price
            quantity: it.quantity,
            _reorder: true, // flag so CafeDetails knows to match by name
        }));
        navigate(`/cafe/${order.cafeId}`, { state: { reorderCart } });
    };

    return (
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", mb: 2, border: "1px solid #e8e0d8", transition: "box-shadow 0.2s", "&:hover": { boxShadow: "0 6px 20px rgba(60,42,33,0.10)" } }}>
            {/* Header row */}
            <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", bgcolor: "#fdfaf7" }}>
                {/* Cafe logo */}
                <Avatar
                    src={order.cafeLogo ? `${BASE}/${order.cafeLogo}` : undefined}
                    variant="rounded"
                    sx={{ width: 52, height: 52, bgcolor: "#e6ccb2" }}
                >
                    <Store sx={{ color: "#2C1E19" }} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#2C1E19" }}>
                        {order.cafeName || "—"}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary">
                            {date} {time && `· ${time}`}
                        </Typography>
                        {order.cafeCity && (
                            <Chip icon={<LocationOn sx={{ fontSize: 12 }} />} label={order.cafeCity} size="small" sx={{ height: 18, fontSize: "0.6rem" }} />
                        )}
                    </Stack>
                </Box>
                <Stack spacing={0.5} alignItems="flex-end">
                    <StatusChip status={order.status} />
                    <PaymentChip status={order.paymentStatus} />
                </Stack>
            </Box>

            <Divider />

            {/* Summary row */}
            <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <TableRestaurant sx={{ fontSize: 16, color: "var(--color-primary)" }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {order.tableLabel || "N/A"}
                            {order.tableCapacity ? ` (Cap: ${order.tableCapacity})` : ""}
                        </Typography>
                    </Stack>
                    {order.bookingDate && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                            <Typography variant="caption" color="text.secondary">
                                {order.bookingDate} {order.bookingTime ? `· ${order.bookingTime}` : ""}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Receipt sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>
                            ₹{Number(order.totalAmount || 0).toFixed(2)}
                        </Typography>
                    </Stack>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    {order.cafeId && (order.items || []).length > 0 && (
                        <Tooltip title="Reorder the same items at this café">
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<Replay sx={{ fontSize: 16 }} />}
                                onClick={handleReorder}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.78rem",
                                    bgcolor: "var(--color-primary)",
                                    borderRadius: 2,
                                    px: 1.5,
                                    "&:hover": { bgcolor: "#2C1E19" }
                                }}
                            >
                                Reorder
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip title={expanded ? "Hide items" : "Show items"}>
                        <Button
                            size="small"
                            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                            onClick={() => setExpanded(!expanded)}
                            sx={{ textTransform: "none", fontWeight: 700, color: "var(--color-primary)" }}
                        >
                            {(order.items || []).length} item{(order.items || []).length !== 1 ? "s" : ""}
                        </Button>
                    </Tooltip>
                </Stack>
            </Box>

            {/* Expandable items section */}
            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ px: 2.5, py: 2, bgcolor: "#f9f6f2" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Items Ordered
                    </Typography>
                    <List dense disablePadding sx={{ mt: 1 }}>
                        {(order.items || []).map((item, idx) => (
                            <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
                                    {item.itemImage ? (
                                        <Avatar
                                            src={`${BASE}/${item.itemImage}`}
                                            variant="rounded"
                                            sx={{ width: 36, height: 36, flexShrink: 0 }}
                                        />
                                    ) : (
                                        <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: "#f0e8e0", flexShrink: 0 }}>
                                            <Fastfood sx={{ fontSize: 18, color: "#d4a373" }} />
                                        </Avatar>
                                    )}
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.itemName || "Item"}</Typography>
                                        <Typography variant="caption" color="text.secondary">{item.itemCategory}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                                        x{item.quantity}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--color-primary)", minWidth: 70, textAlign: "right" }}>
                                        ₹{Number(item.price || 0).toFixed(2)}
                                    </Typography>
                                </Stack>
                            </ListItem>
                        ))}
                    </List>
                    {order.paymentId && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                            Payment ID: <strong>{order.paymentId}</strong>
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </Card>
    );
};

// ─────────────────────────── Main Dashboard ──────────────────────────────────
function CustomerDashboard() {
    const navigate = useNavigate();
    const [currentUser, setUserData] = React.useState(JSON.parse(localStorage.getItem("user") || "{}"));
    const BASE = "http://localhost:5005";
    const DRAWER_WIDTH = 260;

    // Sections: "cafes" | "orders" | "profile"
    const [activeSection, setActiveSection] = React.useState("cafes");

    const [cafes, setCafes] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [filters, setFilters] = React.useState({ delivery: false, takeaway: false, dineIn: false });

    const [selectedCafe, setSelectedCafe] = React.useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [detailLoading, setDetailLoading] = React.useState(false);
    const [tabValue, setTabValue] = React.useState(0);
    const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

    // Previous orders
    const [orders, setOrders] = React.useState([]);
    const [ordersLoading, setOrdersLoading] = React.useState(false);

    const [isEditing, setIsEditing] = React.useState(false);
    const [profileForm, setProfileForm] = React.useState({
        firstName: '', lastName: '', email: '', phone: '',
        dob: '', gender: '', plotNo: '', street: '',
        city: '', pincode: ''
    });
    const token = localStorage.getItem('token');
    const authHdr = { Authorization: `Bearer ${token}` };

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${BASE}/api/profile`, {
                headers: authHdr
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

    const fetchCafes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (filters.delivery) params.append("delivery", "true");
            if (filters.takeaway) params.append("takeaway", "true");
            if (filters.dineIn) params.append("dineIn", "true");
            const res = await fetch(`${BASE}/api/cafes/list?` + params.toString());
            if (res.ok) {
                const data = await res.json();
                setCafes(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch cafes:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        const email = localStorage.getItem("userEmail") || currentUser.email || "";
        if (!email) return;
        setOrdersLoading(true);
        try {
            const res = await fetch(`${BASE}/api/cafes/orders/user/${encodeURIComponent(email)}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleViewCafe = async (id) => {
        navigate(`/cafe/${id}`);
    };

    React.useEffect(() => { 
        fetchCafes(); 
        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BASE}/api/profile`, {
                method: 'PUT',
                headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm)
            });
            const data = await res.json();
            if (res.ok) {
                await fetchProfile();
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch orders when switching to orders section
    React.useEffect(() => {
        if (activeSection === "orders") fetchOrders();
        if (activeSection === "profile") {
            // Already initialized in useEffect, but could re-sync if needed
        }
    }, [activeSection]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("userEmail");
        navigate("/login");
    };

    return (
        <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            {/* ── Sidebar ── */}
            <Drawer
                variant="permanent"
                PaperProps={{ sx: { width: DRAWER_WIDTH, bgcolor: "#2C1E19", color: "white", borderRight: "none" } }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: "#d4a373", color: "#2C1E19", fontWeight: 800 }}>
                            {String(currentUser.firstName || "C").charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography sx={{ fontWeight: 800 }}>{currentUser.firstName || "Customer"}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Customer</Typography>
                        </Box>
                    </Box>
                    <List>
                        <ListItem
                            button
                            onClick={() => setActiveSection("cafes")}
                            sx={{ borderRadius: 2, mb: 0.5, cursor: 'pointer', bgcolor: activeSection === "cafes" ? "rgba(255,255,255,0.15)" : "transparent", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                        >
                            <ListItemIcon sx={{ color: "white" }}><Dashboard /></ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItem>
                        <ListItem
                            button
                            onClick={() => setActiveSection("orders")}
                            sx={{ borderRadius: 2, mb: 0.5, cursor: 'pointer', bgcolor: activeSection === "orders" ? "rgba(255,255,255,0.15)" : "transparent", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                        >
                            <ListItemIcon sx={{ color: "white" }}><History /></ListItemIcon>
                            <ListItemText primary="Previous Orders" />
                        </ListItem>
                        <ListItem 
                            button 
                            onClick={() => setActiveSection("profile")} 
                            sx={{ borderRadius: 2, mb: 0.5, cursor: 'pointer', bgcolor: activeSection === "profile" ? "rgba(255,255,255,0.15)" : "transparent", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                        >
                            <ListItemIcon sx={{ color: "white" }}><PersonIcon /></ListItemIcon>
                            <ListItemText primary="My Profile" />
                        </ListItem>
                        <ListItem button onClick={() => setLogoutDialogOpen(true)} sx={{ borderRadius: 2, cursor: 'pointer', "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                            <ListItemIcon sx={{ color: "white" }}><Coffee /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* ── Main Content ── */}
            <Container maxWidth={false} sx={{ ml: `${DRAWER_WIDTH}px`, py: 4, px: 0, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
                <Box sx={{ px: { xs: 2, md: 4, lg: 6 } }}>

                    {/* ── Header ── */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--color-primary)", fontFamily: "'Playfair Display', serif" }}>
                                Welcome back, {currentUser.firstName || "Customer"}! ☕
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {activeSection === "cafes" ? "What would you like to do today?" : "Your order history at a glance."}
                            </Typography>
                        </Box>
                        <Box />
                    </Box>

                    {/* ── Cafes Section ── */}
                    {activeSection === "cafes" && (
                        <>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: "var(--color-primary)", fontFamily: "'Playfair Display', serif", textAlign: "center", mb: 1 }}>
                                    Registered Cafés
                                </Typography>
                                <Typography variant="body1" color="text.secondary" textAlign="center">
                                    Explore our curated selection of top-rated cafés near you.
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, 1fr)",
                                    md: "repeat(3, 1fr)"
                                },
                                gap: 4,
                                mb: 5
                            }}>
                                {cafes.map((c) => (
                                    <Card
                                        key={c.id}
                                        onClick={() => handleViewCafe(c.id)}
                                        sx={{
                                            borderRadius: 4,
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                                            transition: "all 0.3s ease",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            height: "100%",
                                            width: "100%",
                                            border: "1px solid #eee",
                                            "&:hover": {
                                                transform: "translateY(-8px)",
                                                boxShadow: "0 20px 40px rgba(60,42,33,0.15)"
                                            }
                                        }}
                                    >
                                        {/* Responsive Image Container (16:10 Aspect Ratio) */}
                                        <Box sx={{ position: "relative", width: "100%", pt: "62.5%", bgcolor: "#fcfaf7", flexShrink: 0 }}>
                                            {c.logo || c.exteriorPhoto ? (
                                                <CardMedia
                                                    component="img"
                                                    image={resolveSrc(c.logo || c.exteriorPhoto)}
                                                    alt={c.name}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover"
                                                    }}
                                                />
                                            ) : (
                                                <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Coffee sx={{ fontSize: 48, color: "#e6ccb2" }} />
                                                </Box>
                                            )}
                                            <Box sx={{ position: "absolute", top: 12, right: 12 }}>
                                                <Chip label="Open" size="small" color="success" sx={{ fontWeight: 700, borderRadius: 1.5, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
                                            </Box>
                                        </Box>

                                        <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                            {/* Fixed Height Title Slot (ensures alignment) */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 800,
                                                    color: "#3c2a21",
                                                    mb: 1,
                                                    height: 56, // Fixed height for 2 lines
                                                    overflow: "hidden",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    lineHeight: 1.2,
                                                    fontFamily: "'Playfair Display', serif"
                                                }}
                                            >
                                                {c.name || "Unnamed Café"}
                                            </Typography>

                                            {/* Fixed Height Meta Slot */}
                                            <Box sx={{ height: 60, mb: 2 }}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                    <LocationOn sx={{ fontSize: 16, color: "var(--color-secondary)" }} />
                                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
                                                        {[c.city, c.state].filter(Boolean).join(", ") || "Location N/A"}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <AccessTime sx={{ fontSize: 16, color: "var(--color-primary)" }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.primary" }}>
                                                        {c.openingTime || "--:--"} - {c.closingTime || "--:--"}
                                                    </Typography>
                                                </Stack>
                                            </Box>

                                            <Box sx={{ mt: "auto" }}>
                                                <Divider sx={{ my: 2, opacity: 0.6 }} />
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Box sx={{ display: "flex", gap: 1 }}>
                                                        {c.hasDineIn && <Tooltip title="Dine-in Available"><TableRestaurant sx={{ fontSize: 20, color: "text.secondary" }} /></Tooltip>}
                                                        {c.hasHomeDelivery && <Tooltip title="Delivery Available"><ShoppingCart sx={{ fontSize: 20, color: "text.secondary" }} /></Tooltip>}
                                                    </Box>
                                                    <Typography
                                                        variant="button"
                                                        sx={{
                                                            color: "var(--color-primary)",
                                                            fontWeight: 800,
                                                            fontSize: "0.75rem",
                                                            letterSpacing: 0.5,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 0.5,
                                                            "&:hover": { color: "var(--color-secondary)" }
                                                        }}
                                                    >
                                                        VIEW MENU
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                                {!loading && cafes.length === 0 && (
                                    <Box sx={{ gridColumn: "1 / -1" }}>
                                        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 4, bgcolor: "#fff" }}>
                                            <Info sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
                                            <Typography color="text.secondary">No cafés found matching your criteria.</Typography>
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}

                    {/* ── Previous Orders Section ── */}
                    {activeSection === "orders" && (
                        <Box>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: "var(--color-primary)", fontFamily: "'Playfair Display', serif", textAlign: "center", mb: 1 }}>
                                    Previous Orders
                                </Typography>
                                <Typography variant="body1" color="text.secondary" textAlign="center">
                                    A complete history of your café visits and orders.
                                </Typography>
                            </Box>

                            {ordersLoading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                                    <CircularProgress sx={{ color: "var(--color-primary)" }} />
                                </Box>
                            ) : orders.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, bgcolor: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                                    <History sx={{ fontSize: 64, color: "#e6ccb2", mb: 2 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#2C1E19", mb: 1 }}>No orders yet</Typography>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                                        You haven't placed any orders. Visit a café and book your first table!
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => setActiveSection("cafes")}
                                        sx={{ bgcolor: "var(--color-primary)", textTransform: "none", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#2C1E19" } }}
                                    >
                                        Browse Cafés
                                    </Button>
                                </Paper>
                            ) : (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                                        {orders.length} order{orders.length !== 1 ? "s" : ""} found
                                    </Typography>
                                    {orders.map((order) => (
                                        <OrderCard key={order.orderId} order={order} BASE={BASE} navigate={navigate} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ── Profile Section ── */}
                    {activeSection === "profile" && (
                        <Box sx={{ maxWidth: 900, mx: "auto" }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                                    My Profile
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

                            <Card sx={{ borderRadius: 4, boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: 'hidden', border: '1px solid #eee' }}>
                                <Box sx={{ p: 4, bgcolor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Avatar 
                                        sx={{ width: 100, height: 100, bgcolor: '#d4a373', color: '#2C1E19', fontSize: '2.5rem', fontWeight: 800, border: '4px solid rgba(255,255,255,0.2)' }}
                                    >
                                        {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                                            {currentUser.firstName || 'User'} {currentUser.lastName || ''}
                                        </Typography>
                                        <Chip 
                                            label="Premium Customer" 
                                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }} 
                                            size="small" 
                                        />
                                    </Box>
                                </Box>
                                
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, color: 'var(--color-primary)' }}>
                                        {isEditing ? 'Update Personal Information' : 'Personal Information'}
                                    </Typography>
                                    
                                    {isEditing ? (
                                        <Box component="form" onSubmit={handleProfileUpdate}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="First Name" variant="outlined" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} required />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="Last Name" variant="outlined" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} required />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth type="date" label="Date of Birth" variant="outlined" InputLabelProps={{ shrink: true }} value={profileForm.dob} onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth select label="Gender" variant="outlined" value={profileForm.gender} onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})} SelectProps={{ native: true }}>
                                                        <option value=""></option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="Phone Number" variant="outlined" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <TextField fullWidth label="Plot No" variant="outlined" value={profileForm.plotNo} onChange={(e) => setProfileForm({...profileForm, plotNo: e.target.value})} />
                                                </Grid>
                                                <Grid item xs={12} sm={8}>
                                                    <TextField fullWidth label="Street" variant="outlined" value={profileForm.street} onChange={(e) => setProfileForm({...profileForm, street: e.target.value})} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="City" variant="outlined" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="Pincode" variant="outlined" value={profileForm.pincode} onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})} />
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
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Email sx={{ color: '#d4a373' }} />
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Email Address</Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{currentUser.email}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Phone sx={{ color: '#d4a373' }} />
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{currentUser.phone || 'N/A'}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <CalendarMonth sx={{ color: '#d4a373' }} />
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{currentUser.dob || 'N/A'}</Typography>
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
                                                            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{currentUser.gender || 'N/A'}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <LocationOn sx={{ color: '#d4a373' }} />
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Location</Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                {[currentUser.plotNo, currentUser.street, currentUser.city, currentUser.pincode].filter(Boolean).join(', ') || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
            </Container>

            {/* ── Logout Confirmation Dialog ── */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: "var(--color-primary)", textAlign: "center", pb: 1 }}>
                    Confirm Logout
                </DialogTitle>
                <DialogContent>
                    <Typography textAlign="center" color="text.secondary">
                        Are you sure you want to log out? You will need to sign in again to access your account.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 3, px: 3 }}>
                    <Button onClick={() => setLogoutDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary", px: 3 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="contained"
                        sx={{ bgcolor: "var(--color-primary)", textTransform: "none", fontWeight: 700, borderRadius: 2, px: 4, "&:hover": { bgcolor: "#2C1E19" } }}
                    >
                        Yes, Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CustomerDashboard;
