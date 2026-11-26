import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, computed, inject, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  CAPITALIZACIONES_TASA,
  CapitalizacionDias,
  ClienteActualizarEntrada,
  ClienteCrearEntrada,
  ClienteItem,
  PERIODOS_TASA,
  PeriodoDias,
  TipoTasa,
  VistaPreviaTasasRespuesta,
} from '../../../modelo/cliente';
import { tasa } from '../../../modelo/formato';
import { Moneda } from '../../../modelo/venta';
import { ClienteService } from '../../../servicios/cliente-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';

const DNI_REGEX = /^\d{8}$/;
const TELEFONO_REGEX = /^\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Genera una contraseña temporal aleatoria de 10 caracteres. */
export function generarContrasenaCliente(): string {
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minus = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const todos = mayus + minus + nums;
  const elegir = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  const chars = [elegir(mayus), elegir(minus), elegir(nums), elegir(mayus), elegir(minus), elegir(nums)];
  while (chars.length < 10) chars.push(elegir(todos));
  return chars.join('');
}

/**
 * Modal para registrar o editar un cliente y sus condiciones de crédito (Fig. 10 y 11).
 * Previsualiza en tiempo real la TEA compensatoria/moratoria frente a los topes BCRP.
 */
@Component({
  selector: 'app-cliente-formulario-dialogo',
  imports: [ReactiveFormsModule, Ayuda, ComoUsar, Icono],
  templateUrl: './cliente-formulario-dialogo.html',
  styleUrl: './cliente-formulario-dialogo.css',
})
export class ClienteFormularioDialogo implements OnDestroy {
  private readonly clientes = inject(ClienteService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly guardado = output<ClienteItem>();

  protected readonly editando = signal<ClienteItem | null>(null);
  protected readonly esEdicion = computed(() => this.editando() !== null);
  protected readonly tieneDeuda = computed(() => Number(this.editando()?.saldo_deudor ?? 0) > 0);

  protected readonly verClave = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresCampo = signal<Record<string, string>>({});

  protected readonly previaTasas = signal<VistaPreviaTasasRespuesta | null>(null);
  protected readonly cargandoPrevia = signal(false);
  protected readonly errorPrevia = signal<string | null>(null);

  protected readonly periodos = PERIODOS_TASA;
  protected readonly capitalizaciones = CAPITALIZACIONES_TASA;
  protected readonly tasa = tasa;

  private esperaPrevia?: ReturnType<typeof setTimeout>;
  private pedidoPrevia?: Subscription;

  protected readonly pasos = [
    'Ingresa los datos personales del cliente (DNI de 8 dígitos y teléfono de 9 dígitos) y crea su usuario para el portal.',
    'Define la moneda (soles o dólares), el límite de crédito, el plazo máximo en meses y los días de corte y pago (deben ser distintos, del 1 al 30).',
    'Configura la tasa compensatoria (> 0) y moratoria (>= 0). Si eliges tasa Nominal, indica su capitalización.',
    'Revisa el recuadro de validación BCRP para confirmar que las TEA calculadas no superan el tope legal vigente.',
  ];

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombres_apellidos: [''],
    dni: [''],
    telefono: [''],
    direccion: [''],
    username: [''],
    password: [''],
    email: [''],

    moneda: ['PEN' as Moneda],
    limite_credito: [''],
    plazo_max_meses: [6],
    dia_corte: [20],
    hora_corte: ['23:59'],
    dia_pago: [26],

    tipo_tasa_comp: ['EFECTIVA' as TipoTasa],
    tasa_compensatoria: ['30'],
    periodo_tasa_comp: ['ANUAL' as PeriodoDias],
    capitalizacion_comp: ['MENSUAL' as CapitalizacionDias],

    tipo_tasa_mora: ['EFECTIVA' as TipoTasa],
    tasa_moratoria: ['5'],
    periodo_tasa_mora: ['ANUAL' as PeriodoDias],
    capitalizacion_mora: ['MENSUAL' as CapitalizacionDias],
  });

  ngOnDestroy(): void {
    clearTimeout(this.esperaPrevia);
    this.pedidoPrevia?.unsubscribe();
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.formulario.reset({
      nombres_apellidos: '',
      dni: '',
      telefono: '',
      direccion: '',
      username: '',
      password: '',
      email: '',
      moneda: 'PEN',
      limite_credito: '',
      plazo_max_meses: 6,
      dia_corte: 20,
      hora_corte: '23:59',
      dia_pago: 26,
      tipo_tasa_comp: 'EFECTIVA',
      tasa_compensatoria: '30',
      periodo_tasa_comp: 'ANUAL',
      capitalizacion_comp: 'MENSUAL',
      tipo_tasa_mora: 'EFECTIVA',
      tasa_moratoria: '5',
      periodo_tasa_mora: 'ANUAL',
      capitalizacion_mora: 'MENSUAL',
    });
    this.verClave.set(false);
    this.errorGeneral.set(null);
    this.erroresCampo.set({});
    this.previaTasas.set(null);
    this.errorPrevia.set(null);
    this.dialogo().nativeElement.showModal();
    this.consultarVistaPreviaTasas();
  }

  abrirEditar(cliente: ClienteItem): void {
    this.editando.set(cliente);
    this.formulario.reset({
      nombres_apellidos: cliente.nombres_apellidos,
      dni: cliente.dni,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      username: cliente.username ?? '',
      password: '',
      email: cliente.email ?? '',
      moneda: cliente.moneda,
      limite_credito: String(cliente.limite_credito),
      plazo_max_meses: cliente.plazo_max_meses,
      dia_corte: cliente.dia_corte,
      hora_corte: cliente.hora_corte.slice(0, 5),
      dia_pago: cliente.dia_pago,
      tipo_tasa_comp: cliente.tipo_tasa_comp,
      tasa_compensatoria: String(cliente.tasa_compensatoria),
      periodo_tasa_comp: cliente.periodo_tasa_comp,
      capitalizacion_comp: cliente.capitalizacion_comp ?? 'MENSUAL',
      tipo_tasa_mora: cliente.tipo_tasa_mora,
      tasa_moratoria: String(cliente.tasa_moratoria),
      periodo_tasa_mora: cliente.periodo_tasa_mora,
      capitalizacion_mora: cliente.capitalizacion_mora ?? 'MENSUAL',
    });
    this.verClave.set(false);
    this.errorGeneral.set(null);
    this.erroresCampo.set({});
    this.previaTasas.set(null);
    this.errorPrevia.set(null);
    this.dialogo().nativeElement.showModal();
    this.consultarVistaPreviaTasas();
  }

  protected cerrar(): void {
    clearTimeout(this.esperaPrevia);
    this.pedidoPrevia?.unsubscribe();
    this.dialogo().nativeElement.close();
  }

  protected generarClave(): void {
    this.formulario.controls.password.setValue(generarContrasenaCliente());
    this.verClave.set(true);
    this.limpiarError('password');
  }

  protected limpiarError(campo: string): void {
    if (!this.erroresCampo()[campo]) return;
    this.erroresCampo.update((actual) => {
      const copia = { ...actual };
      delete copia[campo];
      return copia;
    });
  }

  protected alCambiarTasas(): void {
    this.limpiarError('tasa_compensatoria');
    this.limpiarError('tasa_moratoria');
    this.limpiarError('capitalizacion_comp');
    this.limpiarError('capitalizacion_mora');
    clearTimeout(this.esperaPrevia);
    this.esperaPrevia = setTimeout(() => this.consultarVistaPreviaTasas(), 350);
  }

  protected consultarVistaPreviaTasas(): void {
    const v = this.formulario.getRawValue();
    const comp = Number(v.tasa_compensatoria);
    const mora = Number(v.tasa_moratoria);
    if (!Number.isFinite(comp) || comp <= 0 || !Number.isFinite(mora) || mora < 0) {
      this.previaTasas.set(null);
      return;
    }

    this.pedidoPrevia?.unsubscribe();
    this.cargandoPrevia.set(true);
    this.errorPrevia.set(null);

    this.pedidoPrevia = this.clientes
      .vistaPreviaTasas({
        moneda: v.moneda,
        tipo_tasa_comp: v.tipo_tasa_comp,
        tasa_compensatoria: String(comp),
        periodo_tasa_comp: v.periodo_tasa_comp,
        capitalizacion_comp: v.tipo_tasa_comp === 'NOMINAL' ? v.capitalizacion_comp : null,
        tipo_tasa_mora: v.tipo_tasa_mora,
        tasa_moratoria: String(mora),
        periodo_tasa_mora: v.periodo_tasa_mora,
        capitalizacion_mora: v.tipo_tasa_mora === 'NOMINAL' ? v.capitalizacion_mora : null,
      })
      .subscribe({
        next: (r) => {
          this.previaTasas.set(r);
          this.cargandoPrevia.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.previaTasas.set(null);
          this.cargandoPrevia.set(false);
          this.errorPrevia.set(e.error?.detail ?? 'No se pudo verificar las tasas con el BCRP.');
        },
      });
  }

  protected validarLocal(): Record<string, string> {
    const v = this.formulario.getRawValue();
    const errores: Record<string, string> = {};

    const nombres = v.nombres_apellidos.trim();
    const dni = v.dni.trim();
    const telefono = v.telefono.trim();
    const direccion = v.direccion.trim();
    const limite = Number(v.limite_credito);
    const plazo = Number(v.plazo_max_meses);
    const diaCorte = Number(v.dia_corte);
    const diaPago = Number(v.dia_pago);
    const tasaComp = Number(v.tasa_compensatoria);
    const tasaMora = Number(v.tasa_moratoria);

    if (nombres.length < 2) errores['nombres_apellidos'] = 'Ingresa nombres y apellidos (mínimo 2 caracteres).';
    if (!DNI_REGEX.test(dni)) errores['dni'] = 'DNI inválido: debe tener 8 dígitos numéricos.';
    if (!TELEFONO_REGEX.test(telefono)) errores['telefono'] = 'Teléfono inválido: debe tener 9 dígitos numéricos.';
    if (direccion.length < 2) errores['direccion'] = 'Ingresa la dirección (mínimo 2 caracteres).';

    if (!v.limite_credito.trim() || !Number.isFinite(limite) || limite <= 0) {
      errores['limite_credito'] = 'Límite de crédito debe ser positivo.';
    }
    if (!Number.isInteger(plazo) || plazo < 1) {
      errores['plazo_max_meses'] = 'El plazo máximo debe ser al menos 1 mes.';
    }
    if (!Number.isInteger(diaCorte) || diaCorte < 1 || diaCorte > 30) {
      errores['dia_corte'] = 'El día de corte debe estar entre 1 y 30.';
    }
    if (!Number.isInteger(diaPago) || diaPago < 1 || diaPago > 30) {
      errores['dia_pago'] = 'El día de pago debe estar entre 1 y 30.';
    } else if (diaPago === diaCorte) {
      errores['dia_pago'] = 'El día de pago debe ser distinto al día de corte.';
    }

    if (!v.tasa_compensatoria.trim() || !Number.isFinite(tasaComp) || tasaComp <= 0) {
      errores['tasa_compensatoria'] = 'Tasa inválida: debe ser mayor a 0.';
    }
    if (!v.tasa_moratoria.trim() || !Number.isFinite(tasaMora) || tasaMora < 0) {
      errores['tasa_moratoria'] = 'Tasa inválida: no puede ser negativa.';
    }

    if (!this.esEdicion()) {
      const username = v.username.trim();
      const email = v.email.trim();
      if (username.length < 3) errores['username'] = 'Mínimo 3 caracteres.';
      else if (/\s/.test(username)) errores['username'] = 'El usuario no puede contener espacios.';
      else if (username.length > 20) errores['username'] = 'Máximo 20 caracteres.';

      if (v.password.length < 8) errores['password'] = 'La contraseña debe tener al menos 8 caracteres.';
      if (email && !EMAIL_REGEX.test(email)) errores['email'] = 'Ingresa un correo electrónico válido.';
    }

    return errores;
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    const errores = this.validarLocal();
    this.erroresCampo.set(errores);
    if (Object.keys(errores).length > 0) return;

    const v = this.formulario.getRawValue();
    const base: ClienteActualizarEntrada = {
      dni: v.dni.trim(),
      nombres_apellidos: v.nombres_apellidos.trim(),
      telefono: v.telefono.trim(),
      direccion: v.direccion.trim(),
      moneda: v.moneda,
      limite_credito: Number(v.limite_credito).toFixed(2),
      plazo_max_meses: Number(v.plazo_max_meses),
      dia_corte: Number(v.dia_corte),
      hora_corte: v.hora_corte || '23:59',
      dia_pago: Number(v.dia_pago),
      tipo_tasa_comp: v.tipo_tasa_comp,
      tasa_compensatoria: String(Number(v.tasa_compensatoria)),
      periodo_tasa_comp: v.periodo_tasa_comp,
      capitalizacion_comp: v.tipo_tasa_comp === 'NOMINAL' ? v.capitalizacion_comp : null,
      tipo_tasa_mora: v.tipo_tasa_mora,
      tasa_moratoria: String(Number(v.tasa_moratoria)),
      periodo_tasa_mora: v.periodo_tasa_mora,
      capitalizacion_mora: v.tipo_tasa_mora === 'NOMINAL' ? v.capitalizacion_mora : null,
    };

    this.enviando.set(true);
    const actual = this.editando();
    const peticion = actual
      ? this.clientes.actualizar(actual.cliente_id, base)
      : this.clientes.registrar({
          ...base,
          username: v.username.trim(),
          password: v.password,
          email: v.email.trim() || null,
        } satisfies ClienteCrearEntrada);

    peticion.subscribe({
      next: (cliente) => {
        this.enviando.set(false);
        this.cerrar();
        this.guardado.emit(cliente);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        const porCampo = e.error?.errores as Record<string, string> | undefined;
        if (porCampo && Object.keys(porCampo).length > 0) {
          this.erroresCampo.set(porCampo);
          if (e.error?.detail) this.errorGeneral.set(e.error.detail);
          return;
        }
        this.errorGeneral.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
            : (e.error?.detail ?? 'No se pudo guardar el cliente.'),
        );
      },
    });
  }
}
