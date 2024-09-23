import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "inter-ui/inter.css";
import './App.css'
import '@mantine/tiptap/styles.css';
import { Dashboard } from "./pages/Dashboard";
import { Activity } from "./pages/Activity";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/en-gb';



function App() { 

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "activity",
        element: <Activity />,
        children: [
          {
            path: ":id",
            element: <Activity />,
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
