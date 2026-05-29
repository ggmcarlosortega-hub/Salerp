"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Hook para manejar la navegación

export default function Login() {
  const router = useRouter();

  // Estados para capturar las credenciales
  const [correo, setCorreo] = useState("");
  const [password, setpassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const verificarLogin = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setErrorMsg("");

    if (!correo || !password) {
      setErrorMsg("Por favor, complete todos los campos.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const response = await fetch("http://localhost:3001/api/login/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user_salerp", JSON.stringify(data.usuario));
        router.push("/dashboard");
      } else {
        setErrorMsg(data.message || "Credenciales inválidas.");
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      setErrorMsg("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-blue-700 p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px]">

        {/* Lado Izquierdo: Formulario */}
        <form onSubmit={verificarLogin} className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 gap-6">

          <div className="w-full flex flex-col justify-center items-center text-center gap-2">
            <img className="w-20 h-auto mb-2" src="/logo.png" alt="logo" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome back!</h1>
            <p className="text-zinc-500 text-sm">Sign in by entering the information below</p>
          </div>

          {/* Alerta de error si surge alguno */}
          {errorMsg && (
            <div className="w-full max-w-sm bg-red-50 text-red-600 text-sm p-3 rounded-md text-center border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="w-full max-w-sm flex flex-col gap-5">
            <div className="w-full">
              <input
                className="w-full h-11 pl-2 outline-none border-b-2 border-gray-300 focus:border-blue-600 transition-colors bg-transparent text-gray-800"
                type="email"
                placeholder="email@example.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <div className="w-full">
              <input
                className="w-full h-11 pl-2 outline-none border-b-2 border-gray-300 focus:border-blue-700 transition-colors bg-transparent text-gray-800"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setpassword(e.target.value)}
              />
            </div>

            <div className="w-full flex flex-row justify-between items-center mt-1 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-600" />
                <span>Remember Me</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline">¿Olvidó su contraseña?</a>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col items-center gap-5 mt-2">
            <button
              className="w-full h-11 flex justify-center items-center rounded-md text-white bg-blue-500 hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Continue"}
            </button>
          </div>

          <div className="text-sm text-gray-600 mt-4">
            ¿No tiene una cuenta?
            <a href="#" className="text-blue-600 hover:underline ml-1 font-medium">Comunícate con nosotros</a>
          </div>

          <div className="text-xs text-gray-400 mt-auto pt-4">
            @2026 Salerp
          </div>
        </form>

        {/* Lado Derecho: Imagen de fondo */}
        <div className="hidden md:flex md:w-1/2 bg-gray-500 justify-center items-center p-8 border-l border-gray-100">
          <img className="w-full max-w-md h-auto object-contain drop-shadow-xl" src="/inspiracion.png" alt="inspiracion" />
        </div>

      </div>
    </div>
  );
}