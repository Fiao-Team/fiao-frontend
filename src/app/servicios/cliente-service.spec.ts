import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import {
  ClienteCrearEntrada,
  ClienteItem,
  VistaPreviaTasasEntrada,
  VistaPreviaTasasRespuesta,
} from '../modelo/cliente';
import { ClienteService } from './cliente-service';

const CLIENTE_MOCK: ClienteItem = {
  cliente_id: 1,
  dni: '41928653',
  nombres_apellidos: 'Rosa Díaz',
  telefono: '987654321',
  direccion: 'Jr. Las Flores 215',
  username: 'rosa',
  email: 'rosa@correo.pe',
  moneda: 'PEN',
  limite_credito: '500.00',
  saldo_deudor: '255.00',
  disponible: '245.00',
  plazo_max_meses: 6,
  dia_corte: 20,
  hora_corte: '23:59:00',
  dia_pago: 26,
  tipo_tasa_comp: 'EFECTIVA',
  tasa_compensatoria: '30.00',
  periodo_tasa_comp: 'ANUAL',
  capitalizacion_comp: null,
  tea_comp_porcentaje: '30.0000000',
  tipo_tasa_mora: 'EFECTIVA',
  tasa_moratoria: '5.00',
  periodo_tasa_mora: 'ANUAL',
  capitalizacion_mora: null,
  tea_mora_porcentaje: '5.0000000',
  estado: 1,
};

describe('ClienteService', () => {
  let service: ClienteService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/clientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClienteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista clientes con filtros buscar, moneda y solo_activos=false', () => {
    let resultado: ClienteItem[] | undefined;
    service
      .listar({ buscar: ' Rosa ', moneda: 'PEN', solo_activos: false })
      .subscribe((r) => (resultado = r));

    const req = http.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('buscar') === 'Rosa' &&
        r.params.get('moneda') === 'PEN' &&
        r.params.get('solo_activos') === 'false',
    );
    expect(req.request.method).toBe('GET');
    req.flush([CLIENTE_MOCK]);
    expect(resultado).toEqual([CLIENTE_MOCK]);
  });

  it('consulta la vista previa de tasas BCRP con POST /clientes/vista-previa-tasas', () => {
    const entrada: VistaPreviaTasasEntrada = {
      moneda: 'PEN',
      tipo_tasa_comp: 'NOMINAL',
      tasa_compensatoria: '30',
      periodo_tasa_comp: 'ANUAL',
      capitalizacion_comp: 'MENSUAL',
      tipo_tasa_mora: 'EFECTIVA',
      tasa_moratoria: '5',
      periodo_tasa_mora: 'ANUAL',
      capitalizacion_mora: null,
    };
    const salida: VistaPreviaTasasRespuesta = {
      moneda: 'PEN',
      tea_comp_porcentaje: '34.4888824',
      tea_mora_porcentaje: '5.0000000',
      tasa_max_comp_bcrp: '114.1300000',
      tasa_max_mora_bcrp: '17.1195000',
      cumple_bcrp: true,
    };

    let resp: VistaPreviaTasasRespuesta | undefined;
    service.vistaPreviaTasas(entrada).subscribe((r) => (resp = r));

    const req = http.expectOne(`${baseUrl}/vista-previa-tasas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(entrada);
    req.flush(salida);
    expect(resp?.cumple_bcrp).toBe(true);
  });

  it('registra un cliente con POST /clientes', () => {
    const payload: ClienteCrearEntrada = {
      dni: '41928653',
      nombres_apellidos: 'Rosa Díaz',
      telefono: '987654321',
      direccion: 'Jr. Las Flores 215',
      moneda: 'PEN',
      limite_credito: '500.00',
      plazo_max_meses: 6,
      dia_corte: 20,
      hora_corte: '23:59',
      dia_pago: 26,
      tipo_tasa_comp: 'EFECTIVA',
      tasa_compensatoria: '30',
      periodo_tasa_comp: 'ANUAL',
      capitalizacion_comp: null,
      tipo_tasa_mora: 'EFECTIVA',
      tasa_moratoria: '5',
      periodo_tasa_mora: 'ANUAL',
      capitalizacion_mora: null,
      username: 'rosa',
      password: 'ClaveSegura123',
      email: 'rosa@correo.pe',
    };

    service.registrar(payload).subscribe();
    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(CLIENTE_MOCK);
  });

  it('da de baja y reactiva un cliente mediante PATCH', () => {
    service.darDeBaja(1).subscribe();
    const bajaReq = http.expectOne(`${baseUrl}/1/baja`);
    expect(bajaReq.request.method).toBe('PATCH');
    bajaReq.flush({ ...CLIENTE_MOCK, estado: 0 });

    service.reactivar(1).subscribe();
    const actReq = http.expectOne(`${baseUrl}/1/activar`);
    expect(actReq.request.method).toBe('PATCH');
    actReq.flush({ ...CLIENTE_MOCK, estado: 1 });
  });
});
