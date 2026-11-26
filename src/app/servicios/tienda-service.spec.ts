import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { TiendaCrearEntrada, TiendaItem, TiendaListadoSalida } from '../modelo/tienda';
import { TiendaService } from './tienda-service';

const TIENDA_MOCK: TiendaItem = {
  tienda_id: 1,
  nombre_comercial: 'Bodega Don Pepe',
  razon_social: null,
  ruc: '20123456789',
  giro: 'Bodega',
  direccion: 'Av. Universitaria 1200',
  distrito: 'Los Olivos',
  telefono: '987654321',
  dueno_dni: '40123456',
  dueno_nombres: 'José Ramírez',
  dueno_email: 'pepe@bodega.pe',
  dueno_username: 'donpepe',
  moneda_defecto: 'PEN',
  logo_url: null,
  estado: 1,
  clientes_count: 3,
};

describe('TiendaService', () => {
  let service: TiendaService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/tiendas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TiendaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista tiendas enviando solo los filtros activos', () => {
    const respuesta: TiendaListadoSalida = {
      resumen: { total: 2, activas: 1, inactivas: 1 },
      giros: ['Bodega', 'Panadería'],
      tiendas: [TIENDA_MOCK],
    };

    let resultado: TiendaListadoSalida | undefined;
    service.listar({ buscar: '  Don Pepe ', giro: 'Bodega', estado: 'ACTIVA' }).subscribe((r) => {
      resultado = r;
    });

    const req = http.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('buscar') === 'Don Pepe' &&
        r.params.get('giro') === 'Bodega' &&
        r.params.get('estado') === 'ACTIVA',
    );
    expect(req.request.method).toBe('GET');
    req.flush(respuesta);
    expect(resultado).toEqual(respuesta);
  });

  it('omite estado cuando el filtro es TODAS', () => {
    service.listar({ buscar: '', giro: '', estado: 'TODAS' }).subscribe();

    const req = http.expectOne((r) => r.url === baseUrl && r.params.keys().length === 0);
    expect(req.request.method).toBe('GET');
    req.flush({ resumen: { total: 0, activas: 0, inactivas: 0 }, giros: [], tiendas: [] });
  });

  it('registra una nueva tienda con POST /tiendas', () => {
    const payload: TiendaCrearEntrada = {
      nombre_comercial: 'Panadería San José',
      ruc: '20456789123',
      direccion: 'Av. Perú 450',
      distrito: 'SMP',
      telefono: '987654321',
      giro: 'Panadería',
      dueno_nombres: 'María Torres',
      dueno_dni: '40123456',
      dueno_email: 'maria@sanjose.pe',
      username: 'sanjose',
      password: 'ClaveSegura123',
    };

    let creada: TiendaItem | undefined;
    service.registrar(payload).subscribe((r) => (creada = r));

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(TIENDA_MOCK);
    expect(creada?.tienda_id).toBe(1);
  });

  it('actualiza una tienda con PUT /tiendas/{id}', () => {
    const { username: _, password: __, ...actualizacion } = {
      nombre_comercial: 'Bodega Don Pepe Central',
      ruc: '20123456789',
      direccion: 'Av. Universitaria 1200',
      distrito: 'Los Olivos',
      telefono: '987654321',
      giro: 'Bodega',
      dueno_nombres: 'José Ramírez',
      dueno_dni: '40123456',
      dueno_email: 'pepe@bodega.pe',
      username: '',
      password: '',
    };

    service.actualizar(1, actualizacion).subscribe();

    const req = http.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(actualizacion);
    req.flush({ ...TIENDA_MOCK, nombre_comercial: 'Bodega Don Pepe Central' });
  });

  it('da de baja y reactiva una tienda mediante PATCH', () => {
    service.darDeBaja(1).subscribe();
    const bajaReq = http.expectOne(`${baseUrl}/1/baja`);
    expect(bajaReq.request.method).toBe('PATCH');
    bajaReq.flush({ ...TIENDA_MOCK, estado: 0 });

    service.reactivar(1).subscribe();
    const activarReq = http.expectOne(`${baseUrl}/1/activar`);
    expect(activarReq.request.method).toBe('PATCH');
    activarReq.flush({ ...TIENDA_MOCK, estado: 1 });
  });
});
