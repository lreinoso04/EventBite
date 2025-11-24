from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Snack(db.Model):
    """Modelo de datos para los snacks/picaderas"""
    __tablename__ = 'snacks'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    persona_asignada = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='pendiente')
    
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Snack {self.nombre} - {self.persona_asignada}>'
    
    def to_dict(self):
        """Convierte el objeto a diccionario para JSON"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'cantidad': self.cantidad,
            'persona_asignada': self.persona_asignada,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }
    
    @staticmethod
    def from_dict(data):
        """Crea un objeto Snack desde un diccionario"""
        return Snack(
            nombre=data.get('nombre'),
            cantidad=data.get('cantidad', 1),
            persona_asignada=data.get('persona_asignada'),
            estado=data.get('estado', 'pendiente')
        )