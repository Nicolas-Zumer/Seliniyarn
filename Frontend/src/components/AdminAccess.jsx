import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";

function AdminRoute() {
  //Gestion de acceso de cara al frontend para el acceso al panel de administración.
  const context = useOutletContext();
  const { user } = context;
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/Login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (user.rol !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Reenvía el contexto para que las páginas hijas también puedan usarlo.
  return <Outlet context={context} />;
}

export default AdminRoute;