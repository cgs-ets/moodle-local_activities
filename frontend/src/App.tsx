import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "inter-ui/inter.css";
import './App.css'
import { Dashboard } from "./pages/Dashboard";
import { Activity } from "./pages/Activity";

function App() { 

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "new",
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
    <div className="page">
      <RouterProvider router={router} />
    </div>
  );
}

export default App
