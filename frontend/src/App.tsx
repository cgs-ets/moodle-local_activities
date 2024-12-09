import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "inter-ui/inter.css";
import './App.css'
import '@mantine/tiptap/styles.css';
import { Dashboard } from "./pages/Dashboard";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/en-gb';
import { EditActivity } from "./pages/Activity/EditActivity";
import { Permission } from "./pages/Permission/Permission";



function App() { 

  const router = createBrowserRouter(
    [
      {
        index: true, // Matches /
        element: <Dashboard />
      },
      {
        path: "new", // Matches /new
        element: <EditActivity />,
      },
      {
        path: ":id", // Matches /<number>
        element: <EditActivity />,
      },
      {
        path: ":id/permission", // Matches /<number>/permission
        element: <Permission />,
      },
    ],
    {
      basename: '/local/activities'
    }
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
    <div className="page">
      <RouterProvider router={router} />
    </div>

    </LocalizationProvider>
  );
}

export default App
