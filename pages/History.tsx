import React from 'react';
import { HistoryItem } from '../types';
import { Clock, ExternalLink, Music4, Trash2 } from 'lucide-react';

interface HistoryProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ items, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-beatmap-secondary/20 to-transparent p-8 rounded-3xl border border-beatmap-border/10">
        <h1 className="text-3xl font-bold mb-2">Seu Histórico</h1>
        <p className="text-beatmap-muted">Acompanhe todas as playlists que você gerou através do BeatMap.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-beatmap-card/50 rounded-2xl border border-dashed border-beatmap-border/10">
          <Music4 className="mx-auto h-12 w-12 text-beatmap-muted mb-4" />
          <h3 className="text-lg font-medium text-beatmap-text">Nenhuma playlist criada ainda</h3>
          <p className="text-beatmap-muted mt-1">Vá para a aba Descobrir e selecione alguns lançamentos!</p>
        </div>
      ) : (
        <div className="bg-beatmap-card/50 rounded-2xl overflow-hidden border border-beatmap-border/10">
          <table className="w-full text-left">
            <thead className="bg-beatmap-bg/40 text-xs uppercase text-beatmap-muted font-medium">
              <tr>
                <th className="px-6 py-4">Nome da Playlist</th>
                <th className="px-6 py-4">Releases</th>
                <th className="px-6 py-4">Data de Criação</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beatmap-border/5">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-beatmap-text/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-beatmap-primary to-blue-600 flex items-center justify-center text-white font-bold">
                        BM
                      </div>
                      <span className="font-medium text-beatmap-text">{item.playlistName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-beatmap-muted">{item.trackCount} faixas</td>
                  <td className="px-6 py-4 text-beatmap-muted flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(item.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <a 
                        href={item.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-beatmap-accent hover:opacity-80 text-sm font-medium transition-colors"
                        title="Abrir no Spotify"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-beatmap-muted hover:text-red-500 transition-colors p-1"
                        title="Excluir do histórico"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};