"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getHeaders, loginUser } from "@/services/api";

export default function Login() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setpassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [modalContacto, setModalContacto] = useState(false);

  const verificarLogin = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setErrorMsg("");

    if (!correo || !password) {
      setErrorMsg("Por favor, complete todos los campos.");
      return;
    }

    try {
      try {
        const usuario = await loginUser(correo, password);
        if (usuario.rol === "cliente") {
          router.push("/dashboard/cotizar");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        setErrorMsg(err.message || "Credenciales inválidas.");
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      setErrorMsg("No se pudo conectar con el servidor.");
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
              <button type="button" onClick={() => setModalContacto(true)} className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-sm">
                ¿Olvidó su contraseña?
              </button>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col items-center gap-5 mt-2">
            <button
              className="w-full h-11 flex justify-center items-center rounded-md text-white bg-blue-500 hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              type="submit"
            >
              Continue
            </button>
          </div>

          <div className="text-sm text-gray-600 mt-4">
            ¿No tiene una cuenta?
            <button type="button" onClick={() => setModalContacto(true)} className="text-blue-600 hover:underline ml-1 font-medium bg-transparent border-none cursor-pointer p-0 text-sm">
              Comunícate con nosotros
            </button>
          </div>

          <div className="text-xs text-gray-400 mt-auto pt-4">
            @2026 Salerp
          </div>
        </form>

        {/* Lado Derecho: Imagen de fondo */}
<div
  className="hidden md:flex md:w-1/2 justify-center items-center border-l border-gray-100"
  style={{
    background: "linear-gradient(135deg, #F4F8FF 0%, #EAF2FF 45%, #D7E8FF 100%)",
    padding: "48px",
    position: "relative",
    overflow: "hidden",
  }}
>
  <div
    style={{
      position: "absolute",
      width: "260px",
      height: "260px",
      borderRadius: "50%",
      background: "rgba(59, 130, 246, 0.16)",
      top: "-90px",
      right: "-90px",
      filter: "blur(70px)",
    }}
  />

  <div
    style={{
      position: "absolute",
      width: "300px",
      height: "300px",
      borderRadius: "50%",
      background: "rgba(14, 165, 233, 0.14)",
      bottom: "-110px",
      left: "-100px",
      filter: "blur(75px)",
    }}
  />

  <div
    style={{
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: "420px",
      minHeight: "360px",
      borderRadius: "32px",
      background: "rgba(255, 255, 255, 0.72)",
      border: "1px solid rgba(255, 255, 255, 0.95)",
      boxShadow: "0 28px 70px rgba(37, 99, 235, 0.16)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "44px 36px",
    }}
  >
    <img
      src="/SalERP.png"
      alt="Logo SalERP"
      style={{
        width: "100%",
        maxWidth: "270px",
        height: "auto",
        objectFit: "contain",
        filter: "drop-shadow(0 18px 28px rgba(15, 23, 42, 0.18))",
      }}
    />

    <h2
      style={{
        margin: "34px 0 0",
        color: "#102A43",
        fontSize: "26px",
        fontWeight: 800,
        letterSpacing: "-0.04em",
      }}
    >
      Gestiona tu empresa
    </h2>

    <p
      style={{
        margin: "10px 0 0",
        maxWidth: "310px",
        color: "#64748B",
        fontSize: "14px",
        lineHeight: 1.6,
      }}
    >
      Clientes, productos, facturas, gastos e inventario en una sola plataforma.
    </p>
  </div>
</div>

      </div>

      {modalContacto && (
        <div
          onClick={() => setModalContacto(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            background: "rgba(15,23,42,0.58)", backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "400px",
              borderRadius: "1.45rem",
              background: "#fff",
              boxShadow: "0 32px 90px rgba(15,23,42,0.38)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.75rem",
                background: "linear-gradient(135deg,#0f2742 0%,#17324d 55%,#2b547e 100%)",
                color: "#fff",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "3.5rem", height: "3.5rem", margin: "0 auto 0.85rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "1rem",
                  background: "rgba(255,255,255,0.14)",
                  fontSize: "1.6rem",
                }}
              >
                @
              </div>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 950, letterSpacing: "-0.04em" }}>
                  Contáctanos
              </h3>
              <p style={{ margin: "0.5rem 0 0", color: "#dbeafe", fontSize: "0.88rem", lineHeight: 1.5 }}>
                Comunícate a través de nuestros medios oficiales
              </p>
            </div>

            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "0.85rem",
                  padding: "1rem 1.15rem",
                  border: "1px solid #dbe3ec", borderRadius: "1rem",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    width: "2.6rem", height: "2.6rem", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "0.85rem",
                    background: "linear-gradient(135deg,#eaf2fb,#dbeafe)",
                    color: "#244b70", fontWeight: 950, fontSize: "1.1rem",
                  }}
                >
                  ✉
                </div>
                <div>
                  <span style={{ display: "block", color: "#64748b", fontSize: "0.72rem", fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.045em" }}>
                    Correo electrónico
                  </span>
                  <strong style={{ display: "block", marginTop: "0.2rem", color: "#0f172a", fontSize: "0.95rem", fontWeight: 950 }}>
                    salerp@soluciones.co
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ padding: "0 1.75rem 1.5rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setModalContacto(false)}
                style={{
                  width: "100%", padding: "0.86rem 1.25rem",
                  border: "none", borderRadius: "0.9rem",
                  background: "linear-gradient(135deg,#2b547e,#17324d)",
                  color: "#fff", fontSize: "0.88rem", fontWeight: 950,
                  cursor: "pointer",
                  boxShadow: "0 14px 26px rgba(43,84,126,0.23)",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}