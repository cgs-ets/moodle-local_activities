import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "inter-ui/inter.css";
import './App.css'
import '@mantine/tiptap/styles.css';
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/en-gb';
import { EditActivity } from "./pages/Activity/EditActivity";
import { Permission } from "./pages/Permission/Permission";
import { Assessment } from "./pages/Assessment/Assessment";
import { Assessments } from "./pages/Assessment/Assessments";
import { Preview } from "./pages/Preview/Preview";
import { Public } from "./pages/Public/Public";
import { PublicSingle } from "./pages/Public/PublicSingle";
import { VerifySync } from "./pages/VerifySync/VerifySync";
import { Risk } from "./pages/Risk/Risk";
import { Settings } from "./pages/Risk/Settings";


function App() { 

  const router = createBrowserRouter(
    [
      { path: "/", element: <Dashboard /> },
      { path: "/index.php", element: <Dashboard /> },

      { path: "/public", element: <Public /> },
      { path: "/public/index.php", element: <Public /> },
      { path: "/public/:id", element: <PublicSingle /> },

      { path: "new", element: <EditActivity /> },
      { path: "assessments", element: <Assessments /> },
      { path: "assessment", element: <Assessment /> },
      { path: "assessment/:id", element: <Assessment /> },
      { path: ":id/permission", element: <Permission /> },
      { path: ":id/preview", element: <Preview /> },
      { path: "verify-sync", element: <VerifySync /> },

      { path: ":activityid/risk", element: <Risk /> },
      { path: ":activityid/risk/:id", element: <Risk /> },
      { path: "risk/settings", element: <Settings /> },

      { path: ":id", element: <EditActivity /> },


    ],
    { basename: '/local/activities' }
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
