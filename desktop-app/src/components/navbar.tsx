import * as React from 'react';
import { Button, Grid2 } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return(
        <Grid2>
            <Link to='/pages/page_three'>
                <Button>page 3</Button>
            </Link>
            <Link to='/pages/'>
                <Button>page 4</Button>
            </Link>
            <Link to='/pages/'>
                <Button>page 5</Button>
            </Link>
            <Link to='/pages/'>
                <Button>page 6</Button>
            </Link>
        </Grid2>
    )
};

export default Navbar;