module.exports = {
    external_backend_url: 'http://localhost:3001',
    wapi_config: {
        endpoint: 'http://localhost/wordpress/wp-json/',
        username: 'admin',
        password: 'admin'
    },
    categoria_noticia_proyecto_id: 44,
    img_endpoint: 'http://localhost:3001/api/files/getFile' 
}

/*
Configuración del ambiente de Wordpress:
- Crear nueva instancia de wordpress desde 0
- instalar el all-in-one wp migration
- Instalar el backup de wordpress
- desactivar los plugins innecesarios
- establecer usuario y contraseña a utilizar
- descargar el plugin de Basich-Auth authentication para integrar wordpress por API REST:
    https://github.com/WP-API/Basic-Auth
- instalar el plugin de Basich-Auth
- entrar a la base de datos del wordpress y buscar el id de la categoria de proyectos
- colocar la credenciales del wordpress en este archivo (url base, nombre del usuario a utilizar, password del usuario a utilizar)
- colocar en este archivo el id de la categoria de proyectos (variable: categoria_noticia_proyecto_id)
- instalar plugin de WP Statistics
    https://ve.wordpress.org/plugins/wp-statistics/


///tablas de interes para hacer las estadisticas///
wp_statistics_pages
wp_statistics_visit
wp_statistics_visitor
wp_statistics_useronline
wp_statistics_search
wp_statistics_historical
wp_statistics_exclusions
wp_statistics_visitor_relationships

*/