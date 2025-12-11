/**
 * Privacy policy page content.
 *
 * @returns {JSX.Element} Static privacy policy text.
 */
export default function PrivacyPage(): JSX.Element {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Política de privacidad</h1>
        <p>
          Esta aplicación usa Firebase (Auth, Firestore/Storage) para gestionar
          cuentas y datos asociados a reuniones. Los datos que se almacenan incluyen
          correo electrónico, nombre y, si los proporcionas, datos de perfil y reuniones.
        </p>
        <p>
          Usamos estos datos solo para permitir el inicio de sesión, la gestión de tu
          perfil y la creación/administración de reuniones. No vendemos tus datos ni los
          compartimos con terceros ajenos al servicio.
        </p>
        <p>
          Puedes solicitar la eliminación de tu cuenta y datos siguiendo las
          instrucciones en la página de Eliminación de datos.
        </p>
        <p>
          Contacto: norvey550@gmail.com
        </p>
      </div>
    </div>
  );
}
