import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { ProductoEntrada, ProductoItem } from '../modelo/producto';
import { ProductoService } from './producto-service';

const PRODUCTO_MOCK: ProductoItem = {
  producto_id: 10,
  nombre: 'Atún Florida 170g',
  marca: 'Florida',
  categoria: 'Conservas',
  proveedor: 'Distribuidora Lima',
  unidad_medida: 'Lata',
  moneda: 'PEN',
  precio_contado: '5.50',
  precio_lista: '6.00',
  forma_venta_credito: 'FIN_DE_MES',
  imagen_url: null,
  estado: 1,
};

describe('ProductoService', () => {
  let service: ProductoService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/productos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista productos enviando los filtros activos y solo_activos=false cuando corresponde', () => {
    let resultado: ProductoItem[] | undefined;
    service
      .listar({
        buscar: ' Atún ',
        categoria: 'Conservas',
        moneda: 'PEN',
        forma_venta: 'FIN_DE_MES',
        solo_activos: false,
      })
      .subscribe((r) => (resultado = r));

    const req = http.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('buscar') === 'Atún' &&
        r.params.get('categoria') === 'Conservas' &&
        r.params.get('moneda') === 'PEN' &&
        r.params.get('forma_venta') === 'FIN_DE_MES' &&
        r.params.get('solo_activos') === 'false',
    );
    expect(req.request.method).toBe('GET');
    req.flush([PRODUCTO_MOCK]);
    expect(resultado).toEqual([PRODUCTO_MOCK]);
  });

  it('registra un producto con POST /productos', () => {
    const payload: ProductoEntrada = {
      nombre: 'Atún Florida 170g',
      unidad_medida: 'Lata',
      moneda: 'PEN',
      precio_contado: '5.50',
      precio_lista: '6.00',
      forma_venta_credito: 'FIN_DE_MES',
    };

    let creado: ProductoItem | undefined;
    service.registrar(payload).subscribe((r) => (creado = r));

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(PRODUCTO_MOCK);
    expect(creado?.producto_id).toBe(10);
  });

  it('actualiza un producto con PUT /productos/{id}', () => {
    const payload: ProductoEntrada = {
      nombre: 'Atún Florida 170g Pack',
      unidad_medida: 'Lata',
      moneda: 'PEN',
      precio_contado: '5.80',
      precio_lista: '6.50',
      forma_venta_credito: 'AMBAS',
    };

    service.actualizar(10, payload).subscribe();
    const req = http.expectOne(`${baseUrl}/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...PRODUCTO_MOCK, ...payload });
  });

  it('da de baja y reactiva un producto mediante PATCH', () => {
    service.darDeBaja(10).subscribe();
    const bajaReq = http.expectOne(`${baseUrl}/10/baja`);
    expect(bajaReq.request.method).toBe('PATCH');
    bajaReq.flush({ ...PRODUCTO_MOCK, estado: 0 });

    service.reactivar(10).subscribe();
    const actReq = http.expectOne(`${baseUrl}/10/activar`);
    expect(actReq.request.method).toBe('PATCH');
    actReq.flush({ ...PRODUCTO_MOCK, estado: 1 });
  });
});
