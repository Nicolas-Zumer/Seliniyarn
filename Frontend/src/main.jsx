// Configura el punto de entrada de React y las rutas de la tienda.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import {  BrowserRouter, Routes, Route } from 'react-router-dom'
import PlushieDisplay from './pages/plushieDisplay.jsx'
import Plushie from './pages/plushie.jsx'
import PlushieDisplayCategory from './pages/PlushieDisplayCategory.jsx'
import NotFound from './pages/NotFound.jsx'
import Main from './pages/main.jsx'
import Register from './pages/Register.jsx'
import Contact from './pages/contact.jsx'
import CartPayout from './pages/Cart-Payout.jsx'
import About from './pages/about.jsx'
import SalesHistoric from './pages/admin/SalesHistoric.jsx'
import InventoryManagement from './pages/admin/InventoryManagement.jsx'
import Inventory from './pages/admin/Inventory.jsx'
import EventSalesReport from './pages/admin/EventSalesReport.jsx'
import Login from './pages/Login.jsx'
import AdminRoute from "./components/AdminAccess.jsx";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename='/'>
      <Routes>
        <Route path='/' element={<App />}>
          {/* Rutas públicas */}
          <Route index element = {<Main />}/>
          <Route path='PlushiDisplay' element = {<PlushieDisplay />}/>
          <Route path='PlushieDisplayCategory' element = {<PlushieDisplayCategory />}/>
          <Route path='Login' element = {<Login />}/>
          <Route path='Register' element = {<Register />}/>
          <Route path='Contact' element = {<Contact />}/>
          <Route path='CartPayout' element = {<CartPayout />}/>
          <Route path='Plushie/:id' element = {<Plushie />}/>
          <Route path='About' element = {<About />}/>
          {/* Rutas protegidas para administradores */}
          <Route element={<AdminRoute />}>
            <Route path='/Admin/SalesHistoric' element = {<SalesHistoric />}/>
            <Route path='/Admin/InventoryManagement' element = {<InventoryManagement />}/>
            <Route path='/Admin/Inventory' element = {<Inventory />}/>
            <Route path='/Admin/EventSalesReport/:eventId' element = {<EventSalesReport />}/>
          </Route>
          <Route path='*' element = {<NotFound />}/>

        </Route>
      </Routes>
    </BrowserRouter>  </StrictMode>,
)
