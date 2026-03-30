import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    LocalCafe,
    BakeryDining,
    Cookie,
    Grain,
    TakeoutDining,
    WaterDrop
} from '@mui/icons-material';

const BackgroundDecor = () => {
    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            {/* Stickers */}
            <LocalCafe className="bg-sticker sticker-1" />
            <BakeryDining className="bg-sticker sticker-2" />
            <Cookie className="bg-sticker sticker-3" />
            <Grain className="bg-sticker sticker-4" />
            <TakeoutDining className="bg-sticker sticker-5" />
            <WaterDrop className="bg-sticker sticker-6" />

            {/* Quotes */}
            <Typography className="bg-quote quote-1">"Life begins after coffee."</Typography>
            <Typography className="bg-quote quote-2">"Espresso yourself."</Typography>
            <Typography className="bg-quote quote-3">"But first, coffee."</Typography>
            <Typography className="bg-quote quote-4">"Freshly brewed dreams."</Typography>
        </Box>
    );
};

export default BackgroundDecor;
