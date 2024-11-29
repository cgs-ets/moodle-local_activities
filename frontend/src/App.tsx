import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "inter-ui/inter.css";
import './App.css'
import '@mantine/tiptap/styles.css';
import { Dashboard } from "./pages/Dashboard";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/en-gb';
import { EditActivity } from "./pages/Activity/EditActivity";
import { ViewActivity } from "./pages/Activity/ViewActivity";
import { Permission } from "./pages/Permission/Permission";



function App() { 

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "activity",
        children: [
          {
            index: true, // Matches /activity
            element: <EditActivity />,
          },
          {
            path: ":id", // Matches /activity/<number>
            element: <ViewActivity />,
          },
          {
            path: ":id/edit", // Matches /activity/<number>/edit
            element: <EditActivity />,
          },
          {
            path: ":id/permission", // Matches /activity/<number>/permission
            element: <Permission />,
          },
        ],
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
