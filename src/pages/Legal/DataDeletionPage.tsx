export default function DataDeletionPage(): JSX.Element {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Eliminación de datos de usuario</h1>
        <p>
          Si deseas borrar tu cuenta y tus datos (perfil y reuniones), usa el botón
          “Eliminar cuenta” en la página de Perfil una vez hayas iniciado sesión.
        </p>
        <p>
          Alternativamente, puedes solicitar la eliminación enviando un correo a
          norvey550@gmail.com desde el email asociado a tu cuenta. Procesaremos la
          solicitud y borraremos tus datos de Firebase (Auth y base de datos) en un
          plazo razonable.
        </p>
      </div>
    </div>
  );
}
